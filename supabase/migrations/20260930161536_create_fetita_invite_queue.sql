-- Invitaciones a la beta de Fetita enviadas por send-fetita-invite.
--
-- Clave de idempotencia: user_id. Una persona recibe la invitación una sola vez.
-- La fila se reclama ANTES de mandar el mail (status 'pending') y se actualiza
-- cuando Resend responde: 'sent' o 'error'. Sólo las filas en 'error' se
-- reintentan.

CREATE TABLE public.fetita_invite_queue (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'error')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fetita_invite_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage" ON public.fetita_invite_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_view" ON public.fetita_invite_queue
  FOR SELECT USING (public.is_admin());
