export type DownloadableType = 'pdf' | 'template' | 'checklist' | 'guide';
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
  created_at: string;
  updated_at: string;
}
