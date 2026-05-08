export type DownloadableType = 'pdf' | 'template' | 'checklist' | 'guide' | 'image';
export type DownloadableAccessLevel = 'public' | 'authenticated' | 'premium';

export interface DownloadableResource {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: DownloadableType;
  file_path: string;
  bucket_name: string;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
  is_featured: boolean;
  access_level: DownloadableAccessLevel;
  condition_domain: string | null;
  condition_min_level: number | null;
  condition_max_level: number | null;
  created_at: string;
  updated_at: string;
}
