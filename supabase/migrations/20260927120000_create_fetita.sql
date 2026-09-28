-- Fetita: el agente de ProductPrepa, en prueba con un grupo chico.
--
-- Versión mínima para validar la experiencia: cada persona habilitada tiene
-- un hilo de conversación con Fetita, que arranca con el historial de sus
-- evaluaciones. Para sacarla alcanza con borrar estas tablas y la función
-- fetita-chat. Las conversaciones se guardan completas, también los turnos que
-- fallaron, para analizarlas y armar evals.

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
