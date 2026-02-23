-- Drop old constraint and recreate with scheduled status
ALTER TABLE public.blog_posts
DROP CONSTRAINT blog_posts_status_check;

ALTER TABLE public.blog_posts
ADD CONSTRAINT blog_posts_status_check
CHECK (status IN ('draft', 'published', 'scheduled'));