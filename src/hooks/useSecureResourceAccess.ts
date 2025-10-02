import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Resource } from './useResources';

export interface SecureResourceAccess {
  signedUrl: string | null;
  loading: boolean;
  error: string | null;
}

export function useSecureResourceAccess(resource: Resource | null): SecureResourceAccess {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getSecureUrl() {
      if (!resource) {
        setSignedUrl(null);
        return;
      }

      // If resource is in public bucket, use direct URL
      if (resource.bucket_name === 'resources') {
        setSignedUrl(resource.file_url);
        return;
      }

      // For private bucket, generate signed URL
      setLoading(true);
      setError(null);

      try {
        const { data, error: signError } = await supabase.storage
          .from(resource.bucket_name)
          .createSignedUrl(resource.file_url, 86400); // 24 hours

        if (signError) throw signError;
        
        setSignedUrl(data.signedUrl);
      } catch (err) {
        if (import.meta.env.DEV) console.error('Error generating signed URL:', err);
        setError('No se pudo acceder al recurso');
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    }

    getSecureUrl();
  }, [resource]);

  return { signedUrl, loading, error };
}
