import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'starterpack_progress';

interface ResourceProgress {
  downloadedSlugs: string[];
  lastUpdated: string;
}

export function useResourceProgress() {
  const [downloadedSlugs, setDownloadedSlugs] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const progress: ResourceProgress = JSON.parse(stored);
        setDownloadedSlugs(progress.downloadedSlugs || []);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading resource progress:', error);
    }
  }, []);

  // Save to localStorage
  const saveProgress = useCallback((slugs: string[]) => {
    try {
      const progress: ResourceProgress = {
        downloadedSlugs: slugs,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving resource progress:', error);
    }
  }, []);

  // Mark a resource as downloaded
  const markAsDownloaded = useCallback((slug: string) => {
    setDownloadedSlugs(prev => {
      if (prev.includes(slug)) return prev;
      const updated = [...prev, slug];
      saveProgress(updated);
      return updated;
    });
  }, [saveProgress]);

  // Check if a resource is downloaded
  const isDownloaded = useCallback((slug: string) => {
    return downloadedSlugs.includes(slug);
  }, [downloadedSlugs]);

  // Get completion stats
  const getCompletionStats = useCallback((totalResources: number) => {
    const completed = downloadedSlugs.length;
    const percentage = totalResources > 0 ? Math.round((completed / totalResources) * 100) : 0;
    return { completed, total: totalResources, percentage };
  }, [downloadedSlugs]);

  return {
    downloadedSlugs,
    markAsDownloaded,
    isDownloaded,
    getCompletionStats,
  };
}
