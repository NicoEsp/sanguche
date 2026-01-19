-- Create bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true);

-- Policy: Authenticated users can upload/update/delete
CREATE POLICY "Authenticated users can manage course thumbnails"
ON storage.objects
FOR ALL
USING (bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'course-thumbnails' AND auth.role() = 'authenticated');

-- Policy: Public read access
CREATE POLICY "Public can view course thumbnails"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-thumbnails');