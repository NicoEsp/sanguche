-- Add video_type column to course_lessons
ALTER TABLE public.course_lessons
ADD COLUMN video_type text NOT NULL DEFAULT 'external';

-- Create private bucket for course videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-videos', 'course-videos', false);

-- Storage policies: only service_role can upload/delete
CREATE POLICY "Service role manages course videos"
ON storage.objects
FOR ALL
USING (bucket_id = 'course-videos' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'course-videos' AND auth.role() = 'service_role');

-- Admins can manage course videos
CREATE POLICY "Admins manage course videos"
ON storage.objects
FOR ALL
USING (bucket_id = 'course-videos' AND public.is_admin())
WITH CHECK (bucket_id = 'course-videos' AND public.is_admin());

-- Authenticated users can read course videos (access controlled by edge function signed URLs)
CREATE POLICY "Authenticated users can read course videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-videos' AND auth.uid() IS NOT NULL);