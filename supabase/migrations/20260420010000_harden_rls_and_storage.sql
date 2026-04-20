-- Hardening pass after Lovable breach remediation.
-- Addresses Supabase Advisors warnings:
--   1) rls_policy_always_true on public.course_waitlist
--   2) public_bucket_allows_listing on course-thumbnails, resources, starterpack

-- ============================================================================
-- 1. course_waitlist: replace permissive INSERT policy with validated one
-- ============================================================================
-- Previous policy allowed anon/authenticated to insert any shape of row
-- (WITH CHECK TRUE). The app only ever inserts { email }, so constrain the
-- check to a well-formed email of reasonable length. The existing UNIQUE
-- constraint on email (signalled by error code 23505 handling in the client)
-- continues to prevent duplicate spam from the same address.

DROP POLICY IF EXISTS "Anyone can insert into course_waitlist"
  ON public.course_waitlist;

CREATE POLICY "anon_insert_course_waitlist_valid_email"
  ON public.course_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 5 AND 254
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );

-- ============================================================================
-- 2. Storage: drop broad SELECT policies that enable .list() on public buckets
-- ============================================================================
-- These buckets are marked public, so object URLs keep working without any
-- policy. Dropping the SELECT policies only disables directory listing via
-- storage.from(bucket).list(), which the app never calls.

DROP POLICY IF EXISTS "Public can view course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view resource files"    ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view starterpack files" ON storage.objects;
