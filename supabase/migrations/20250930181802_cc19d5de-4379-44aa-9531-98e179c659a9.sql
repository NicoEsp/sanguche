-- Create enum for resource visibility
CREATE TYPE resource_visibility AS ENUM ('public', 'conditional');

-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  visibility_type resource_visibility NOT NULL DEFAULT 'public',
  condition_domain TEXT,
  condition_min_level INTEGER CHECK (condition_min_level >= 1 AND condition_min_level <= 5),
  condition_max_level INTEGER CHECK (condition_max_level >= 1 AND condition_max_level <= 5),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources
CREATE POLICY "Anyone can view active resources"
  ON public.resources
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all resources"
  ON public.resources
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for resource PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true);

-- Storage policies for resources bucket
CREATE POLICY "Anyone can view resource files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'resources');

CREATE POLICY "Admins can upload resource files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'resources' AND is_admin());

CREATE POLICY "Admins can update resource files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'resources' AND is_admin());

CREATE POLICY "Admins can delete resource files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'resources' AND is_admin());