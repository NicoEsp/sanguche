-- Unify `resources` into `downloadable_resources`.
-- Rule: rows with condition_domain set are surfaced in SkillGaps; rows without it appear in /descargables.

-- 1. Add competency-based visibility fields
ALTER TABLE public.downloadable_resources
  ADD COLUMN IF NOT EXISTS condition_domain TEXT,
  ADD COLUMN IF NOT EXISTS condition_min_level INTEGER
    CHECK (condition_min_level IS NULL OR (condition_min_level >= 1 AND condition_min_level <= 5)),
  ADD COLUMN IF NOT EXISTS condition_max_level INTEGER
    CHECK (condition_max_level IS NULL OR (condition_max_level >= 1 AND condition_max_level <= 5));

CREATE INDEX IF NOT EXISTS idx_downloadable_resources_condition_domain
  ON public.downloadable_resources(condition_domain)
  WHERE condition_domain IS NOT NULL;

-- 2. Allow 'image' as a type (drop the existing CHECK and recreate with the wider set)
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.downloadable_resources'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%type%pdf%'
  LOOP
    EXECUTE format('ALTER TABLE public.downloadable_resources DROP CONSTRAINT %I', constraint_record.conname);
  END LOOP;
END $$;

ALTER TABLE public.downloadable_resources
  ADD CONSTRAINT downloadable_resources_type_check
  CHECK (type IN ('pdf', 'template', 'checklist', 'guide', 'image'));

-- 3. Migrate every row from `resources` into `downloadable_resources`.
--    file_url in `resources` is a full public URL like .../storage/v1/object/public/resources/<path>
--    `downloadable_resources` stores only the path inside the bucket, so we extract everything after /resources/.
--    Conditional rows that were `public` get bumped to `authenticated` (they require a logged-in user with an assessment).
INSERT INTO public.downloadable_resources (
  slug, title, description, type, file_path, bucket_name, thumbnail_url,
  display_order, is_active, is_featured, access_level,
  condition_domain, condition_min_level, condition_max_level,
  created_at, updated_at
)
SELECT
  lower(regexp_replace(r.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(r.id::text, 1, 8) AS slug,
  r.name AS title,
  NULL AS description,
  'pdf' AS type,
  COALESCE(substring(r.file_url FROM '/resources/(.+)$'), r.file_url) AS file_path,
  'resources' AS bucket_name,
  NULL AS thumbnail_url,
  r.display_order,
  r.is_active,
  false AS is_featured,
  CASE
    WHEN r.visibility_type = 'conditional' AND r.access_level = 'public' THEN 'authenticated'::resource_access_level
    ELSE r.access_level
  END AS access_level,
  r.condition_domain,
  r.condition_min_level,
  r.condition_max_level,
  r.created_at,
  r.updated_at
FROM public.resources r
WHERE NOT EXISTS (
  SELECT 1 FROM public.downloadable_resources d
  WHERE d.title = r.name AND d.bucket_name = 'resources'
);

-- 4. Allow public read on the legacy `resources` storage bucket so migrated rows keep working.
--    Bucket was created public in the initial migration; the public-read policy already exists.
--    No bucket changes needed here — bucket_name='resources' on the row is enough for getPublicUrl().

-- 5. Note: the legacy public.resources table is intentionally NOT dropped in this migration.
--    It will be dropped in a follow-up migration once the unified flow is verified in production.
