-- Fix: dedicated private resources (Mentoría) could not be opened by their owner.
--
-- Symptom: a Premium user clicking a mentor resource backed by an uploaded file
-- got the toast "No se pudo abrir el archivo" because supabase.storage
-- .createSignedUrl() was denied by RLS on storage.objects.
--
-- Root cause: the SELECT policy "Users can view their dedicated private resources"
-- compares the dedicated-resource path against the storage object key with an
-- UNQUALIFIED `name`:
--
--     EXISTS (
--       SELECT 1 FROM user_dedicated_resources udr
--       JOIN profiles p ON p.id = udr.user_id
--       WHERE p.user_id = auth.uid()
--         AND udr.file_url = name        -- intended: storage.objects.name
--     )
--
-- Because the subquery's FROM list joins `profiles` (which also has a `name`
-- column), Postgres resolved the unqualified `name` to `profiles.name` (inner
-- scope wins over the correlated outer `storage.objects`). That predicate is
-- never true for a file path, so the EXISTS always returned false and every
-- owner was denied — even though the file existed, the path matched, and the
-- user was the legitimate owner.
--
-- Fix: qualify the comparison explicitly against storage.objects.name.

DROP POLICY IF EXISTS "Users can view their dedicated private resources" ON storage.objects;

CREATE POLICY "Users can view their dedicated private resources"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-resources'
  AND (
    EXISTS (
      SELECT 1
      FROM public.user_dedicated_resources udr
      JOIN public.profiles p ON p.id = udr.user_id
      WHERE p.user_id = auth.uid()
        AND udr.file_url = storage.objects.name
    )
    OR public.is_admin()
  )
);
