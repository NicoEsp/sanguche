
-- Table for exclusive sessions that can be shared via link
CREATE TABLE public.exclusive_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  session_date timestamp with time zone,
  max_spots integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table for reservations
CREATE TABLE public.session_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.exclusive_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reserved_at timestamp with time zone DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- RLS on exclusive_sessions
ALTER TABLE public.exclusive_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sessions"
  ON public.exclusive_sessions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage sessions"
  ON public.exclusive_sessions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS on session_reservations
ALTER TABLE public.session_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations"
  ON public.session_reservations FOR SELECT
  USING (user_id = get_profile_id_for_auth());

CREATE POLICY "Premium users can reserve"
  ON public.session_reservations FOR INSERT
  WITH CHECK (user_id = get_profile_id_for_auth() AND has_active_premium());

CREATE POLICY "Admins manage all reservations"
  ON public.session_reservations FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "session_reservations_deny_anonymous"
  ON public.session_reservations FOR ALL
  TO anon
  USING (false);
