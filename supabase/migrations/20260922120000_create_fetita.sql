-- Fetita: el agente de ProductPrepa, en beta cerrada.
--
-- Fetita conversa con una persona de producto sobre UNA decisión por
-- conversación, la desafía siguiendo un protocolo de 7 pasos y deja un memo
-- con veredicto. Corre en la edge function fetita-chat contra la API de Claude.
--
-- Qué hay acá:
--   fetita_settings       interruptor general, presupuesto mensual en USD y
--                         límite de mensajes por defecto (una sola fila).
--   fetita_access         a quién habilitó el admin, con límite propio opcional.
--   fetita_conversations  una decisión por conversación.
--   fetita_messages       los turnos. api_messages guarda los mensajes exactos
--                         que se mandaron a la API para reenviarlos tal cual en
--                         el turno siguiente (el historial es append-only).
--   fetita_memos          cada versión del memo de una decisión.
--   fetita_memo_checks    el juez automático de alucinaciones sobre cada memo.
--   fetita_memo_reviews   la revisión manual del admin (privada).
--   fetita_runs           cada request a la API: tokens, costo, latencia.
--   fetita_feedback       pulgar arriba/abajo de la persona sobre cada respuesta.
--
-- Todas las tablas usan profiles.id como user_id, igual que el resto del
-- dominio. Los usuarios leen sólo lo propio; escribe la edge function con
-- service role. El admin lee todo y escribe por RPC, con log en
-- admin_actions_log.

-- ---------------------------------------------------------------------------
-- Configuración general
-- ---------------------------------------------------------------------------

CREATE TABLE public.fetita_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  monthly_budget_usd numeric(10, 2) NOT NULL DEFAULT 30 CHECK (monthly_budget_usd >= 0),
  default_monthly_messages integer NOT NULL DEFAULT 60
    CHECK (default_monthly_messages BETWEEN 1 AND 10000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.fetita_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.fetita_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_settings_admin_select" ON public.fetita_settings
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- Acceso por usuario
-- ---------------------------------------------------------------------------

CREATE TABLE public.fetita_access (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  -- NULL = usa default_monthly_messages de fetita_settings.
  monthly_message_limit integer
    CHECK (monthly_message_limit IS NULL OR monthly_message_limit BETWEEN 1 AND 10000),
  note text CHECK (note IS NULL OR length(note) <= 500),
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fetita_access ENABLE ROW LEVEL SECURITY;

-- Sólo el admin lee esta tabla: la nota es interna. La persona ve su acceso y
-- su cupo con get_my_fetita_status().
CREATE POLICY "fetita_access_admin_select" ON public.fetita_access
  FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

CREATE TRIGGER update_fetita_access_updated_at
  BEFORE UPDATE ON public.fetita_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Conversaciones
-- ---------------------------------------------------------------------------

CREATE TABLE public.fetita_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nueva decisión' CHECK (length(title) BETWEEN 1 AND 200),
  -- Paso del protocolo en el que está la decisión (1 a 7). Lo actualiza Fetita.
  protocol_step smallint NOT NULL DEFAULT 1 CHECK (protocol_step BETWEEN 1 AND 7),
  -- Veredicto del último memo, para listar sin abrir cada conversación.
  verdict text CHECK (verdict IS NULL OR verdict IN ('listo', 'falta', 'frenar')),
  -- La autoevaluación de la persona al crear la conversación. Se congela: si
  -- cambiara entre turnos invalidaría la caché y el razonamiento guardado.
  perfil_snapshot text CHECK (perfil_snapshot IS NULL OR length(perfil_snapshot) <= 20000),
  prompt_version text NOT NULL,
  model text NOT NULL,
  user_message_count integer NOT NULL DEFAULT 0 CHECK (user_message_count >= 0),
  -- Un turno a la vez por conversación: la edge function toma este lock antes
  -- de llamar a la API y lo suelta al terminar. Vence solo si la función muere.
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fetita_conversations_user_recent
  ON public.fetita_conversations (user_id, last_message_at DESC);
-- La lista de conversaciones del admin.
CREATE INDEX idx_fetita_conversations_recent
  ON public.fetita_conversations (last_message_at DESC);

ALTER TABLE public.fetita_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_conversations_select_own_or_admin" ON public.fetita_conversations
  FOR SELECT TO authenticated
  USING (user_id = (SELECT public.get_profile_id_for_auth()) OR (SELECT public.is_admin()));

-- Borrar una conversación borra sus mensajes, memos, checks y feedback. El
-- costo queda en fetita_runs. Mientras Fetita responde (lock vigente) no se
-- puede borrar: el turno todavía está escribiendo en ella.
CREATE POLICY "fetita_conversations_delete_own" ON public.fetita_conversations
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT public.get_profile_id_for_auth())
    AND (locked_until IS NULL OR locked_until < now())
  );

CREATE TRIGGER update_fetita_conversations_updated_at
  BEFORE UPDATE ON public.fetita_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Mensajes
-- ---------------------------------------------------------------------------

CREATE TABLE public.fetita_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Orden estable dentro de la conversación (created_at puede empatar).
  seq bigint GENERATED ALWAYS AS IDENTITY,
  conversation_id uuid NOT NULL REFERENCES public.fetita_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  -- Lo que ve la persona: su mensaje, o el texto visible de la respuesta.
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'complete'
    CHECK (status IN ('complete', 'truncated', 'refused', 'error')),
  -- Si la persona pegó material: cuántos caracteres (el material no se
  -- guarda) y la lectura que se hizo de él, que es lo que entra a la
  -- conversación.
  material_chars integer CHECK (material_chars IS NULL OR material_chars >= 0),
  material_summary text,
  -- Los mensajes exactos de este turno para la API, en orden, como JSON en
  -- texto. Se reenvían sin tocar: editar un turno anterior invalida el
  -- razonamiento de los siguientes y rompe la caché. Es text y no jsonb a
  -- propósito: jsonb reordena las claves de los objetos, y el input de una
  -- herramienta reenviado con otro orden ya es otra conversación para la API.
  api_messages text NOT NULL DEFAULT '[]' CHECK (left(api_messages, 1) = '['),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fetita_messages_conversation_seq
  ON public.fetita_messages (conversation_id, seq);
CREATE INDEX idx_fetita_messages_user ON public.fetita_messages (user_id);

ALTER TABLE public.fetita_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_messages_select_own_or_admin" ON public.fetita_messages
  FOR SELECT TO authenticated
  USING (user_id = (SELECT public.get_profile_id_for_auth()) OR (SELECT public.is_admin()));

-- api_messages tiene el razonamiento y los inputs de herramientas: lo lee sólo
-- la edge function (service role). Desde el cliente se leen las demás columnas.
REVOKE SELECT ON public.fetita_messages FROM anon, authenticated;
GRANT SELECT (id, seq, conversation_id, user_id, role, content, status, material_chars, material_summary, created_at)
  ON public.fetita_messages TO authenticated;

-- ---------------------------------------------------------------------------
-- Memos
-- ---------------------------------------------------------------------------

CREATE TABLE public.fetita_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.fetita_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version >= 1),
  verdict text NOT NULL CHECK (verdict IN ('listo', 'falta', 'frenar')),
  content jsonb NOT NULL CHECK (jsonb_typeof(content) = 'object'),
  prompt_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, version)
);

CREATE INDEX idx_fetita_memos_created_at ON public.fetita_memos (created_at DESC);
CREATE INDEX idx_fetita_memos_user ON public.fetita_memos (user_id);

ALTER TABLE public.fetita_memos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_memos_select_own_or_admin" ON public.fetita_memos
  FOR SELECT TO authenticated
  USING (user_id = (SELECT public.get_profile_id_for_auth()) OR (SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- Calidad: juez automático, revisión del admin y feedback de la persona
-- ---------------------------------------------------------------------------

CREATE TABLE public.fetita_memo_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id uuid NOT NULL REFERENCES public.fetita_memos(id) ON DELETE CASCADE,
  model text NOT NULL,
  status text NOT NULL CHECK (status IN ('ok', 'error')),
  claims_total integer NOT NULL DEFAULT 0 CHECK (claims_total >= 0),
  claims_supported integer NOT NULL DEFAULT 0 CHECK (claims_supported >= 0),
  claims_partial integer NOT NULL DEFAULT 0 CHECK (claims_partial >= 0),
  claims_unsupported integer NOT NULL DEFAULT 0 CHECK (claims_unsupported >= 0),
  result jsonb,
  error text,
  cost_usd numeric(12, 6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fetita_memo_checks_memo ON public.fetita_memo_checks (memo_id, created_at DESC);

ALTER TABLE public.fetita_memo_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_memo_checks_admin_select" ON public.fetita_memo_checks
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

CREATE TABLE public.fetita_memo_reviews (
  memo_id uuid PRIMARY KEY REFERENCES public.fetita_memos(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('correcto', 'alucinacion', 'desafio_flojo')),
  note text CHECK (note IS NULL OR length(note) <= 2000),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fetita_memo_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_memo_reviews_admin_select" ON public.fetita_memo_reviews
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

CREATE TABLE public.fetita_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.fetita_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating IN (-1, 1)),
  reason text CHECK (reason IS NULL OR reason IN ('invento_algo', 'no_me_desafio', 'confuso', 'otro')),
  comment text CHECK (comment IS NULL OR length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX idx_fetita_feedback_created_at ON public.fetita_feedback (created_at DESC);
CREATE INDEX idx_fetita_feedback_user ON public.fetita_feedback (user_id);

ALTER TABLE public.fetita_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_feedback_select_own_or_admin" ON public.fetita_feedback
  FOR SELECT TO authenticated
  USING (user_id = (SELECT public.get_profile_id_for_auth()) OR (SELECT public.is_admin()));

-- Sólo sobre respuestas de Fetita de una conversación propia.
CREATE POLICY "fetita_feedback_insert_own" ON public.fetita_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT public.get_profile_id_for_auth())
    AND EXISTS (
      SELECT 1 FROM public.fetita_messages m
      WHERE m.id = message_id
        AND m.user_id = (SELECT public.get_profile_id_for_auth())
        AND m.role = 'assistant'
    )
  );

CREATE POLICY "fetita_feedback_update_own" ON public.fetita_feedback
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT public.get_profile_id_for_auth()))
  WITH CHECK (
    user_id = (SELECT public.get_profile_id_for_auth())
    AND EXISTS (
      SELECT 1 FROM public.fetita_messages m
      WHERE m.id = message_id
        AND m.user_id = (SELECT public.get_profile_id_for_auth())
        AND m.role = 'assistant'
    )
  );

CREATE POLICY "fetita_feedback_delete_own" ON public.fetita_feedback
  FOR DELETE TO authenticated
  USING (user_id = (SELECT public.get_profile_id_for_auth()));

CREATE TRIGGER update_fetita_feedback_updated_at
  BEFORE UPDATE ON public.fetita_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Consumo de la API
-- ---------------------------------------------------------------------------

CREATE TABLE public.fetita_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Es el registro de gasto: sobrevive a que se borre el usuario o la
  -- conversación. conversation_id no tiene FK a propósito: si la conversación
  -- se borra a mitad de un turno, el costo de ese turno se registra igual.
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  conversation_id uuid,
  -- Agrupa las requests de un mismo turno (una por ronda de herramientas).
  -- El límite mensual cuenta turnos distintos de tipo chat.
  turn_id uuid,
  kind text NOT NULL CHECK (kind IN ('chat', 'material', 'judge')),
  model_requested text NOT NULL,
  model_served text,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cache_read_tokens integer NOT NULL DEFAULT 0,
  cache_write_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(12, 6) NOT NULL DEFAULT 0,
  -- false = el modelo no estaba en la tabla de precios y se cobró como Opus 5.
  price_known boolean NOT NULL DEFAULT true,
  latency_ms integer,
  stop_reason text,
  prompt_version text,
  fallback_used boolean NOT NULL DEFAULT false,
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fetita_runs_created_at ON public.fetita_runs (created_at DESC);
CREATE INDEX idx_fetita_runs_user_created_at ON public.fetita_runs (user_id, created_at DESC);
CREATE INDEX idx_fetita_runs_conversation ON public.fetita_runs (conversation_id);

ALTER TABLE public.fetita_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_runs_admin_select" ON public.fetita_runs
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- Estado de acceso y cupo
-- ---------------------------------------------------------------------------

-- Inicio del mes calendario en hora de Argentina: el cupo y el presupuesto se
-- renuevan ahí.
CREATE OR REPLACE FUNCTION public.fetita_month_start()
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT date_trunc('month', now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
         AT TIME ZONE 'America/Argentina/Buenos_Aires';
$$;

-- Estado completo de un perfil. Lo usan fetita_begin_turn() antes de cada
-- turno y get_my_fetita_status() para la UI. El admin (rol admin en
-- user_roles) siempre está habilitado y no tiene tope de mensajes ni se frena
-- con el interruptor general, así puede probar con Fetita pausada; el
-- presupuesto sí lo frena, porque es plata.
CREATE OR REPLACE FUNCTION public.fetita_status_for(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings public.fetita_settings%ROWTYPE;
  v_access public.fetita_access%ROWTYPE;
  v_is_admin boolean;
  v_month_start timestamptz := public.fetita_month_start();
  v_used integer;
  v_spent numeric;
  v_limit integer;
  v_user_enabled boolean;
  v_reason text;
BEGIN
  SELECT * INTO v_settings FROM public.fetita_settings WHERE id = 1;
  SELECT * INTO v_access FROM public.fetita_access WHERE user_id = p_profile_id;

  v_is_admin := EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_profile_id AND ur.role = 'admin'
  );

  v_limit := coalesce(v_access.monthly_message_limit, v_settings.default_monthly_messages, 60);
  v_user_enabled := v_is_admin OR coalesce(v_access.enabled, false);

  -- La navegación consulta esto para todas las personas logueadas: sin acceso
  -- no hace falta sumar el mes.
  v_used := 0;
  v_spent := 0;
  IF v_user_enabled THEN
    -- Cuenta turnos con al menos una respuesta del modelo: un turno que falló
    -- por la API o que Fetita declinó no le gasta un mensaje a la persona.
    SELECT count(DISTINCT r.turn_id) INTO v_used
    FROM public.fetita_runs r
    WHERE r.user_id = p_profile_id
      AND r.kind = 'chat'
      AND r.error_code IS NULL
      AND r.stop_reason IS DISTINCT FROM 'refusal'
      AND r.created_at >= v_month_start;

    SELECT coalesce(sum(r.cost_usd), 0) INTO v_spent
    FROM public.fetita_runs r
    WHERE r.created_at >= v_month_start;
  END IF;

  v_reason := CASE
    WHEN NOT v_user_enabled THEN 'sin_acceso'
    WHEN NOT coalesce(v_settings.enabled, false) AND NOT v_is_admin THEN 'pausada'
    WHEN v_spent >= coalesce(v_settings.monthly_budget_usd, 0) THEN 'presupuesto'
    WHEN v_used >= v_limit AND NOT v_is_admin THEN 'limite_mensual'
    ELSE NULL
  END;

  RETURN jsonb_build_object(
    'user_enabled', v_user_enabled,
    'global_enabled', coalesce(v_settings.enabled, false),
    'is_admin', v_is_admin,
    'monthly_limit', CASE WHEN v_is_admin THEN NULL ELSE v_limit END,
    'used_this_month', v_used,
    'remaining', CASE WHEN v_is_admin THEN NULL ELSE greatest(v_limit - v_used, 0) END,
    'can_chat', v_reason IS NULL,
    'reason', v_reason,
    'month_start', v_month_start,
    'spent_this_month_usd', v_spent,
    'monthly_budget_usd', v_settings.monthly_budget_usd
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fetita_status_for(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fetita_status_for(uuid) TO service_role;

-- Arranca un turno: valida acceso, cupo y presupuesto y toma el lock de la
-- conversación (o la crea con el lock puesto), todo en una transacción.
--
-- Una persona tiene un solo turno en curso a la vez, en cualquier
-- conversación. El advisory lock por perfil serializa los pedidos
-- simultáneos de la misma persona: sin él, varios pedidos en paralelo verían
-- el mismo cupo usado (el turno se cuenta recién cuando responde el modelo) y
-- pasarían todos.
--
-- Devuelve {status: ok|blocked|busy|busy_other|not_found}. Con ok trae la
-- conversación; con blocked trae el motivo de fetita_status_for.
--
-- Es una función y no un PATCH por la API porque PostgREST vuelve a aplicar
-- los filtros sobre la fila ya actualizada, y el filtro "sin lock vigente"
-- deja de cumplirse justo por haber puesto el lock.
CREATE OR REPLACE FUNCTION public.fetita_begin_turn(
  p_profile_id uuid,
  p_conversation_id uuid,
  p_lock_seconds integer,
  p_prompt_version text,
  p_model text,
  p_perfil text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status jsonb;
  v_row public.fetita_conversations%ROWTYPE;
  v_lock_until timestamptz := now() + make_interval(secs => greatest(p_lock_seconds, 1));
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('fetita_turn:' || p_profile_id::text, 0));

  v_status := public.fetita_status_for(p_profile_id);
  IF NOT (v_status->>'can_chat')::boolean THEN
    RETURN jsonb_build_object('status', 'blocked', 'reason', v_status->>'reason');
  END IF;

  IF p_conversation_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.fetita_conversations
    WHERE id = p_conversation_id AND user_id = p_profile_id
  ) THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.fetita_conversations
    WHERE user_id = p_profile_id AND locked_until > now()
  ) THEN
    RETURN jsonb_build_object(
      'status',
      CASE WHEN EXISTS (
        SELECT 1 FROM public.fetita_conversations
        WHERE id = p_conversation_id AND locked_until > now()
      ) THEN 'busy' ELSE 'busy_other' END
    );
  END IF;

  IF p_conversation_id IS NULL THEN
    INSERT INTO public.fetita_conversations (user_id, perfil_snapshot, prompt_version, model, locked_until)
    VALUES (
      p_profile_id,
      nullif(btrim(left(coalesce(p_perfil, ''), 20000)), ''),
      p_prompt_version,
      p_model,
      v_lock_until
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE public.fetita_conversations
    SET locked_until = v_lock_until
    WHERE id = p_conversation_id AND user_id = p_profile_id
    RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'status', 'ok',
    'conversation', jsonb_build_object(
      'id', v_row.id,
      'title', v_row.title,
      'perfil_snapshot', v_row.perfil_snapshot,
      'prompt_version', v_row.prompt_version,
      'user_message_count', v_row.user_message_count
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fetita_begin_turn(uuid, uuid, integer, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fetita_begin_turn(uuid, uuid, integer, text, text, text) TO service_role;

-- Lo que la UI necesita saber del usuario logueado. No expone el gasto global.
CREATE OR REPLACE FUNCTION public.get_my_fetita_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id uuid := public.get_profile_id_for_auth();
  v_status jsonb;
BEGIN
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('user_enabled', false, 'can_chat', false, 'reason', 'sin_acceso');
  END IF;

  v_status := public.fetita_status_for(v_profile_id);
  RETURN v_status - 'spent_this_month_usd' - 'monthly_budget_usd';
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_fetita_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_fetita_status() TO authenticated;

-- ---------------------------------------------------------------------------
-- RPCs del admin
-- ---------------------------------------------------------------------------

-- Habilita o deshabilita a un usuario, por profile id o por email. El límite y
-- la nota se guardan tal como llegan: NULL en el límite vuelve al default.
CREATE OR REPLACE FUNCTION public.admin_set_fetita_access(
  p_target_profile_id uuid DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_enabled boolean DEFAULT true,
  p_monthly_message_limit integer DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id uuid := p_target_profile_id;
  v_admin_profile_id uuid := public.get_profile_id_for_auth();
  v_previous public.fetita_access%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  IF v_profile_id IS NULL THEN
    IF p_email IS NULL OR btrim(p_email) = '' THEN
      RAISE EXCEPTION 'Indicá el usuario por id o por email.';
    END IF;
    SELECT id INTO v_profile_id
    FROM public.profiles
    WHERE lower(email) = lower(btrim(p_email))
    ORDER BY created_at
    LIMIT 1;
    IF v_profile_id IS NULL THEN
      RAISE EXCEPTION 'No hay ninguna cuenta con el email %. La persona tiene que registrarse primero en /auth.', btrim(p_email);
    END IF;
  ELSIF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_profile_id) THEN
    RAISE EXCEPTION 'Perfil no encontrado.';
  END IF;

  IF p_monthly_message_limit IS NOT NULL AND (p_monthly_message_limit < 1 OR p_monthly_message_limit > 10000) THEN
    RAISE EXCEPTION 'El límite mensual tiene que estar entre 1 y 10000 mensajes.';
  END IF;

  SELECT * INTO v_previous FROM public.fetita_access WHERE user_id = v_profile_id;

  INSERT INTO public.fetita_access (user_id, enabled, monthly_message_limit, note, granted_by)
  VALUES (v_profile_id, p_enabled, p_monthly_message_limit, nullif(btrim(p_note), ''), v_admin_profile_id)
  ON CONFLICT (user_id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    monthly_message_limit = EXCLUDED.monthly_message_limit,
    note = EXCLUDED.note,
    granted_by = EXCLUDED.granted_by;

  PERFORM public.log_admin_action(
    v_profile_id,
    'fetita_access',
    jsonb_build_object(
      'enabled', p_enabled,
      'previous_enabled', v_previous.enabled,
      'monthly_message_limit', p_monthly_message_limit,
      'previous_monthly_message_limit', v_previous.monthly_message_limit,
      'note', p_note
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'enabled', p_enabled,
    'monthly_message_limit', p_monthly_message_limit
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_fetita_access(uuid, text, boolean, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_fetita_access(uuid, text, boolean, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_fetita_settings(
  p_enabled boolean,
  p_monthly_budget_usd numeric,
  p_default_monthly_messages integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_previous public.fetita_settings%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  IF p_enabled IS NULL OR p_monthly_budget_usd IS NULL OR p_default_monthly_messages IS NULL THEN
    RAISE EXCEPTION 'Faltan valores de configuración.';
  END IF;
  IF p_monthly_budget_usd < 0 OR p_monthly_budget_usd > 100000 THEN
    RAISE EXCEPTION 'El presupuesto mensual tiene que estar entre 0 y 100000 USD.';
  END IF;
  IF p_default_monthly_messages < 1 OR p_default_monthly_messages > 10000 THEN
    RAISE EXCEPTION 'El límite por defecto tiene que estar entre 1 y 10000 mensajes.';
  END IF;

  SELECT * INTO v_previous FROM public.fetita_settings WHERE id = 1 FOR UPDATE;

  UPDATE public.fetita_settings SET
    enabled = p_enabled,
    monthly_budget_usd = round(p_monthly_budget_usd, 2),
    default_monthly_messages = p_default_monthly_messages,
    updated_at = now(),
    updated_by = public.get_profile_id_for_auth()
  WHERE id = 1;

  PERFORM public.log_admin_action(
    NULL,
    'fetita_settings',
    jsonb_build_object(
      'enabled', p_enabled,
      'previous_enabled', v_previous.enabled,
      'monthly_budget_usd', p_monthly_budget_usd,
      'previous_monthly_budget_usd', v_previous.monthly_budget_usd,
      'default_monthly_messages', p_default_monthly_messages,
      'previous_default_monthly_messages', v_previous.default_monthly_messages
    )
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_fetita_settings(boolean, numeric, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_fetita_settings(boolean, numeric, integer) TO authenticated;

-- Revisión manual de un memo. p_status NULL borra la revisión.
CREATE OR REPLACE FUNCTION public.admin_review_fetita_memo(
  p_memo_id uuid,
  p_status text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_memo_owner uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  SELECT user_id INTO v_memo_owner FROM public.fetita_memos WHERE id = p_memo_id;
  IF v_memo_owner IS NULL THEN
    RAISE EXCEPTION 'Memo no encontrado.';
  END IF;

  IF p_status IS NULL THEN
    DELETE FROM public.fetita_memo_reviews WHERE memo_id = p_memo_id;
  ELSE
    IF p_status NOT IN ('correcto', 'alucinacion', 'desafio_flojo') THEN
      RAISE EXCEPTION 'Estado de revisión inválido: %', p_status;
    END IF;
    INSERT INTO public.fetita_memo_reviews (memo_id, status, note, reviewed_by, reviewed_at)
    VALUES (p_memo_id, p_status, nullif(btrim(p_note), ''), public.get_profile_id_for_auth(), now())
    ON CONFLICT (memo_id) DO UPDATE SET
      status = EXCLUDED.status,
      note = EXCLUDED.note,
      reviewed_by = EXCLUDED.reviewed_by,
      reviewed_at = EXCLUDED.reviewed_at;
  END IF;

  PERFORM public.log_admin_action(
    v_memo_owner,
    'fetita_memo_review',
    jsonb_build_object('memo_id', p_memo_id, 'status', p_status, 'note', p_note)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_fetita_memo(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_fetita_memo(uuid, text, text) TO authenticated;

-- Tablero del admin: consumo y calidad en un rango. Todo se agrega en SQL para
-- no traer filas crudas al navegador.
CREATE OR REPLACE FUNCTION public.admin_fetita_overview(
  p_from timestamptz,
  p_to timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_month_start timestamptz := public.fetita_month_start();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_from >= p_to THEN
    RAISE EXCEPTION 'Rango de fechas inválido.';
  END IF;

  WITH runs AS (
    SELECT * FROM public.fetita_runs WHERE created_at >= p_from AND created_at < p_to
  ),
  totals AS (
    SELECT
      coalesce(sum(cost_usd), 0) AS cost_usd,
      count(*) AS requests,
      count(DISTINCT turn_id) FILTER (WHERE kind = 'chat') AS chat_turns,
      count(DISTINCT user_id) FILTER (WHERE kind = 'chat') AS active_users,
      coalesce(sum(input_tokens), 0) AS input_tokens,
      coalesce(sum(output_tokens), 0) AS output_tokens,
      coalesce(sum(cache_read_tokens), 0) AS cache_read_tokens,
      coalesce(sum(cache_write_tokens), 0) AS cache_write_tokens,
      count(*) FILTER (WHERE error_code IS NOT NULL) AS errors,
      count(*) FILTER (WHERE stop_reason = 'refusal') AS refusals,
      count(*) FILTER (WHERE fallback_used) AS fallbacks,
      count(*) FILTER (WHERE NOT price_known) AS unpriced,
      round(avg(latency_ms) FILTER (WHERE kind = 'chat' AND error_code IS NULL)) AS avg_latency_ms,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)
        FILTER (WHERE kind = 'chat' AND error_code IS NULL) AS p95_latency_ms
    FROM runs
  ),
  by_day AS (
    SELECT
      (created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date AS day,
      sum(cost_usd) AS cost_usd,
      count(*) AS requests,
      count(DISTINCT turn_id) FILTER (WHERE kind = 'chat') AS chat_turns
    FROM runs
    GROUP BY 1
  ),
  by_kind AS (
    SELECT kind, sum(cost_usd) AS cost_usd, count(*) AS requests
    FROM runs GROUP BY kind
  ),
  by_model AS (
    SELECT coalesce(model_served, model_requested) AS model, sum(cost_usd) AS cost_usd, count(*) AS requests
    FROM runs GROUP BY 1
  ),
  by_user AS (
    SELECT
      r.user_id,
      p.name,
      p.email,
      sum(r.cost_usd) AS cost_usd,
      count(DISTINCT r.turn_id) FILTER (WHERE r.kind = 'chat') AS chat_turns,
      count(DISTINCT r.conversation_id) AS conversations,
      max(r.created_at) AS last_active
    FROM runs r
    LEFT JOIN public.profiles p ON p.id = r.user_id
    GROUP BY r.user_id, p.name, p.email
  ),
  memos AS (
    SELECT m.id, m.verdict FROM public.fetita_memos m
    WHERE m.created_at >= p_from AND m.created_at < p_to
  ),
  latest_checks AS (
    SELECT DISTINCT ON (c.memo_id) c.*
    FROM public.fetita_memo_checks c
    JOIN memos ON memos.id = c.memo_id
    WHERE c.status = 'ok'
    ORDER BY c.memo_id, c.created_at DESC
  ),
  checks AS (
    SELECT
      count(*) AS memos_checked,
      coalesce(sum(claims_total), 0) AS claims_total,
      coalesce(sum(claims_unsupported), 0) AS claims_unsupported,
      coalesce(sum(claims_partial), 0) AS claims_partial,
      count(*) FILTER (WHERE claims_unsupported > 0) AS memos_with_unsupported
    FROM latest_checks
  ),
  reviews AS (
    SELECT rv.status, count(*) AS n
    FROM public.fetita_memo_reviews rv JOIN memos ON memos.id = rv.memo_id
    GROUP BY rv.status
  ),
  feedback AS (
    SELECT
      count(*) FILTER (WHERE rating = 1) AS up,
      count(*) FILTER (WHERE rating = -1) AS down,
      count(*) FILTER (WHERE reason = 'invento_algo') AS invento_algo,
      count(*) FILTER (WHERE reason = 'no_me_desafio') AS no_me_desafio,
      count(*) FILTER (WHERE reason = 'confuso') AS confuso,
      count(*) FILTER (WHERE reason = 'otro') AS otro
    FROM public.fetita_feedback
    WHERE created_at >= p_from AND created_at < p_to
  ),
  assistant_messages AS (
    SELECT count(*) AS n FROM public.fetita_messages
    WHERE role = 'assistant' AND created_at >= p_from AND created_at < p_to
  ),
  month AS (
    SELECT
      coalesce((SELECT sum(cost_usd) FROM public.fetita_runs WHERE created_at >= v_month_start), 0) AS spent_usd,
      s.monthly_budget_usd,
      s.enabled,
      s.default_monthly_messages
    FROM public.fetita_settings s WHERE s.id = 1
  )
  SELECT jsonb_build_object(
    'range', jsonb_build_object('from', p_from, 'to', p_to),
    'totals', (SELECT to_jsonb(totals) FROM totals),
    'by_day', coalesce((SELECT jsonb_agg(to_jsonb(by_day) ORDER BY day) FROM by_day), '[]'::jsonb),
    'by_kind', coalesce((SELECT jsonb_agg(to_jsonb(by_kind) ORDER BY cost_usd DESC) FROM by_kind), '[]'::jsonb),
    'by_model', coalesce((SELECT jsonb_agg(to_jsonb(by_model) ORDER BY cost_usd DESC) FROM by_model), '[]'::jsonb),
    'by_user', coalesce((SELECT jsonb_agg(to_jsonb(by_user) ORDER BY cost_usd DESC) FROM by_user), '[]'::jsonb),
    'quality', jsonb_build_object(
      'memos_total', (SELECT count(*) FROM memos),
      'verdicts', coalesce((SELECT jsonb_object_agg(verdict, n) FROM (SELECT verdict, count(*) AS n FROM memos GROUP BY verdict) v), '{}'::jsonb),
      'checks', (SELECT to_jsonb(checks) FROM checks),
      'reviews', coalesce((SELECT jsonb_object_agg(status, n) FROM reviews), '{}'::jsonb),
      'feedback', (SELECT to_jsonb(feedback) FROM feedback),
      'assistant_messages', (SELECT n FROM assistant_messages)
    ),
    'month', (SELECT to_jsonb(month) FROM month) || jsonb_build_object('month_start', v_month_start)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_fetita_overview(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_fetita_overview(timestamptz, timestamptz) TO authenticated;
