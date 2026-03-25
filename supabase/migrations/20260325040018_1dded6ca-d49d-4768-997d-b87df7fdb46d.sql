
CREATE TABLE public.product_review_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_review_waitlist ENABLE ROW LEVEL SECURITY;

-- Deny anonymous
CREATE POLICY "product_review_waitlist_deny_anon"
  ON public.product_review_waitlist
  FOR ALL TO anon
  USING (false);

-- Admin can view all
CREATE POLICY "product_review_waitlist_admin_select"
  ON public.product_review_waitlist
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Authenticated users can insert (with their profile id)
CREATE POLICY "product_review_waitlist_insert_own"
  ON public.product_review_waitlist
  FOR INSERT TO authenticated
  WITH CHECK (user_id = public.get_profile_id_for_auth());

-- Service role full access
CREATE POLICY "product_review_waitlist_service_role"
  ON public.product_review_waitlist
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
