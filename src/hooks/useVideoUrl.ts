import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VideoUrlState {
  url: string | null;
  type: "external" | "storage";
  isLoading: boolean;
  error: string | null;
}

export function useVideoUrl(
  lessonId: string,
  videoType: string | undefined,
  videoUrl: string
): VideoUrlState & { refresh: () => void } {
  const [state, setState] = useState<VideoUrlState>({
    url: null,
    type: (videoType as "external" | "storage") || "external",
    isLoading: false,
    error: null,
  });

  const renewalTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isMountedRef = useRef(true);

  const fetchSignedUrl = useCallback(async () => {
    if (!lessonId) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke("get-course-video", {
        body: { lesson_id: lessonId },
      });

      if (!isMountedRef.current) return;

      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Error al obtener el video",
        }));
        return;
      }

      setState({
        url: data.url,
        type: data.type,
        isLoading: false,
        error: null,
      });

      // Auto-renew 30 min before expiry for storage videos
      if (data.type === "storage" && data.expires_at) {
        const expiresAt = new Date(data.expires_at).getTime();
        const renewIn = expiresAt - Date.now() - 30 * 60 * 1000; // 30 min before
        if (renewIn > 0) {
          renewalTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) fetchSignedUrl();
          }, renewIn);
        }
      }
    } catch {
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Error de conexión",
        }));
      }
    }
  }, [lessonId]);

  useEffect(() => {
    isMountedRef.current = true;

    // External videos: return URL directly without edge function call
    if (!videoType || videoType === "external") {
      setState({
        url: videoUrl,
        type: "external",
        isLoading: false,
        error: null,
      });
      return;
    }

    // Storage videos: fetch signed URL
    fetchSignedUrl();

    return () => {
      isMountedRef.current = false;
      if (renewalTimerRef.current) clearTimeout(renewalTimerRef.current);
    };
  }, [lessonId, videoType, videoUrl, fetchSignedUrl]);

  return { ...state, refresh: fetchSignedUrl };
}
