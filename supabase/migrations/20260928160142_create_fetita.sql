-- Fetita: el agente de ProductPrepa, en prueba con un grupo chico.
--
-- Versión mínima para validar la experiencia: cada persona habilitada tiene
-- un hilo de conversación con Fetita, que arranca con el historial de sus
-- evaluaciones. Las conversaciones se guardan completas, también los turnos
-- que fallaron, para analizarlas y armar evals; las métricas van a Mixpanel
-- sin el contenido. Para sacarla alcanza con borrar estas tablas, el cron
-- fetita-abandoned y la función fetita-chat.

-- Quién puede usar Fetita. La fila existe = habilitada. La escribe sólo el
-- admin: no va como columna de profiles porque cada persona puede editar su
-- propio perfil.
CREATE TABLE public.fetita_access (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fetita_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_access_select_own_or_admin" ON public.fetita_access
  FOR SELECT TO authenticated
  USING (user_id = public.get_profile_id_for_auth() OR public.is_admin());

CREATE POLICY "fetita_access_admin_insert" ON public.fetita_access
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "fetita_access_admin_delete" ON public.fetita_access
  FOR DELETE TO authenticated USING (public.is_admin());

-- Cada versión del system prompt, para saber con cuál se respondió cada
-- mensaje y poder reproducirlo en un eval. La edge function la registra sola:
-- la versión es un hash del texto, así que no hay que acordarse de subirla.
CREATE TABLE public.fetita_prompts (
  version text PRIMARY KEY,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fetita_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_prompts_admin_select" ON public.fetita_prompts
  FOR SELECT TO authenticated USING (public.is_admin());

-- Los mensajes. Escribe sólo la edge function (service role).
CREATE TABLE public.fetita_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Orden estable: el mensaje de la persona y la respuesta se guardan juntos.
  seq bigint GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Una conversación. Cambia con "Empezar de nuevo" y es la unidad para
  -- analizar y armar evals.
  thread_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  -- ok: parte de la conversación. fallido: la API dio error o no respondió;
  -- queda para análisis y no se le reenvía al modelo.
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'fallido')),
  error text,
  -- Lo que se ve en el chat.
  content text NOT NULL,
  -- Los bloques exactos que se mandaron o recibieron de la API, como JSON en
  -- texto: el turno siguiente los reenvía sin tocar, como pide la API para el
  -- razonamiento del modelo.
  api_content text NOT NULL,
  -- Resumen del razonamiento de Fetita para esta respuesta. La persona no lo ve.
  reasoning text,
  -- Con qué versión del prompt se respondió.
  prompt_version text REFERENCES public.fetita_prompts(version),
  -- Métricas: el paso en que queda la conversación después de esta respuesta,
  -- y el veredicto y el motivo del cierre si lo hubo. Salen de marcas que el
  -- modelo agrega al final y que no se muestran.
  step text CHECK (step IS NULL OR step IN ('context', 'challenge', 'closing')),
  verdict text CHECK (verdict IS NULL OR verdict IN ('avanzar', 'falta_evidencia', 'frenar')),
  close_reason text CHECK (close_reason IS NULL OR close_reason IN ('completo', 'tope', 'pedido')),
  -- El pulgar de la persona sobre un cierre.
  feedback text CHECK (feedback IS NULL OR feedback IN ('up', 'down')),
  feedback_comment text,
  -- Consumo de la respuesta, para saber cuánto cuesta cada conversación.
  model text,
  input_tokens integer,
  output_tokens integer,
  cache_read_tokens integer,
  cache_write_tokens integer,
  -- "Empezar de nuevo" archiva el hilo en lugar de borrarlo.
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fetita_messages_active ON public.fetita_messages (user_id, seq) WHERE archived_at IS NULL;
CREATE INDEX idx_fetita_messages_thread ON public.fetita_messages (thread_id, seq);

ALTER TABLE public.fetita_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_messages_select_own_or_admin" ON public.fetita_messages
  FOR SELECT TO authenticated
  USING (user_id = public.get_profile_id_for_auth() OR public.is_admin());

-- Abandono: una conversación sin veredicto y sin actividad hace 30 minutos.
-- Un cron junta las nuevas y las manda a Mixpanel como fetita_abandoned. Cada
-- una se reporta una vez por último mensaje: si la persona vuelve y la deja de
-- nuevo, cuenta otra vez.
CREATE TABLE public.fetita_abandoned (
  thread_id uuid NOT NULL,
  last_seq bigint NOT NULL,
  reported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, last_seq)
);

ALTER TABLE public.fetita_abandoned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_abandoned_admin_select" ON public.fetita_abandoned
  FOR SELECT TO authenticated USING (public.is_admin());

-- Marca las conversaciones abandonadas que todavía no se reportaron y devuelve
-- los eventos listos para la API de Mixpanel. Sin contenido de los mensajes:
-- sólo ids, conteos y el último paso, igual que los eventos de fetita-chat.
CREATE OR REPLACE FUNCTION public.fetita_collect_abandoned()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_events jsonb;
BEGIN
  WITH threads AS (
    SELECT
      m.thread_id,
      m.user_id,
      max(m.seq) AS last_seq,
      max(m.created_at) AS last_at,
      count(*) FILTER (WHERE m.role = 'user' AND m.status = 'ok') AS user_messages,
      bool_or(m.verdict IS NOT NULL) AS has_verdict,
      (array_agg(m.step ORDER BY m.seq DESC) FILTER (WHERE m.step IS NOT NULL))[1] AS last_step,
      (array_agg(m.prompt_version ORDER BY m.seq DESC))[1] AS prompt_version
    FROM public.fetita_messages m
    GROUP BY m.thread_id, m.user_id
  ),
  nuevas AS (
    INSERT INTO public.fetita_abandoned (thread_id, last_seq)
    SELECT t.thread_id, t.last_seq
    FROM threads t
    WHERE NOT t.has_verdict
      AND t.last_at < now() - interval '30 minutes'
      AND t.last_at > now() - interval '1 day'
    ON CONFLICT DO NOTHING
    RETURNING thread_id, last_seq
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'event', 'fetita_abandoned',
    'properties', jsonb_build_object(
      -- El token público del proyecto, el mismo que usa el frontend.
      'token', '35fe7a2706398ebc90ae3f1012d0a558',
      'distinct_id', p.user_id,
      '$user_id', p.user_id,
      'user_id', p.user_id,
      '$insert_id', 'fetita-abandoned-' || t.thread_id || '-' || t.last_seq,
      'conversation_id', t.thread_id,
      'prompt_version', t.prompt_version,
      'last_step', coalesce(t.last_step, 'context'),
      'user_messages_count', t.user_messages,
      'seconds_since_last_message', round(extract(epoch FROM now() - t.last_at))
    )
  )), '[]'::jsonb)
  INTO v_events
  FROM nuevas n
  JOIN threads t ON t.thread_id = n.thread_id AND t.last_seq = n.last_seq
  JOIN public.profiles p ON p.id = t.user_id;

  RETURN v_events;
END;
$$;

REVOKE ALL ON FUNCTION public.fetita_collect_abandoned() FROM PUBLIC, anon, authenticated;

-- Cada 15 minutos. El token de Mixpanel es público, así que no hace falta un
-- secreto en Vault como en los otros crons.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'fetita-abandoned',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://api.mixpanel.com/track?ip=0',
    body := e.events,
    headers := '{"Content-Type": "application/json"}'::jsonb
  )
  FROM (SELECT public.fetita_collect_abandoned() AS events) e
  WHERE jsonb_array_length(e.events) > 0;
  $cron$
);
