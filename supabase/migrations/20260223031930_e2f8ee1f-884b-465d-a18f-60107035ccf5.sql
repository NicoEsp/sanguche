ALTER TABLE public.blog_posts
ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;