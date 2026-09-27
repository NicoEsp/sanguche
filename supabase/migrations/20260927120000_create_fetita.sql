-- Fetita: el agente de ProductPrepa, en prueba con un grupo chico.
--
-- Versión mínima para validar la experiencia: cada persona habilitada tiene
-- un hilo de conversación con Fetita, que arranca con el historial de sus
-- evaluaciones. Para sacarla alcanza con borrar estas dos tablas y la función
-- fetita-chat.

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

-- Los mensajes. Escribe sólo la edge function (service role).
CREATE TABLE public.fetita_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Orden estable: el mensaje de la persona y la respuesta se guardan juntos.
  seq bigint GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  -- Lo que se ve en el chat.
  content text NOT NULL,
  -- Los bloques exactos que se mandaron o recibieron de la API, como JSON en
  -- texto: el turno siguiente los reenvía sin tocar, como pide la API para el
  -- razonamiento del modelo.
  api_content text NOT NULL,
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

ALTER TABLE public.fetita_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fetita_messages_select_own_or_admin" ON public.fetita_messages
  FOR SELECT TO authenticated
  USING (user_id = public.get_profile_id_for_auth() OR public.is_admin());
