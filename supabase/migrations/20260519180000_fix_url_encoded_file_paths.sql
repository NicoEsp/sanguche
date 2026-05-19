-- Fix downloadable_resources.file_path rows that were stored URL-encoded
-- (e.g. "Reflexiones%20sobre%20Product%20Discovery.pdf") while the underlying
-- storage objects have literal spaces. This mismatch made getPublicUrl /
-- createSignedUrl resolve to keys that Storage rejects with `InvalidKey`,
-- breaking the "Ver PDF" preview on /mejoras and the download on /descargables.
UPDATE downloadable_resources
SET file_path = REPLACE(file_path, '%20', ' ')
WHERE file_path LIKE '%\%20%' ESCAPE '\';
