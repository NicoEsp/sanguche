import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AssessmentResult } from '@/utils/scoring';
import { shouldShowResource } from '@/utils/resourceFilters';

export interface Resource {
  id: string;
  name: string;
  file_url: string;
  visibility_type: 'public' | 'conditional';
  condition_domain: string | null;
  condition_min_level: number | null;
  condition_max_level: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  access_level: 'public' | 'authenticated' | 'premium';
  bucket_name: string;
}

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setResources(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Error al cargar recursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  return { resources, loading, error, refetch: fetchResources };
}

export function useAvailableResources(assessmentResult: AssessmentResult | null) {
  const { resources, loading, error } = useResources();
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);

  useEffect(() => {
    if (!resources.length) {
      setAvailableResources([]);
      return;
    }

    const filtered = resources.filter(resource => {
      if (!resource.is_active) return false;
      return shouldShowResource(resource, assessmentResult);
    });

    setAvailableResources(filtered);
  }, [resources, assessmentResult]);

  return { resources: availableResources, loading, error };
}
