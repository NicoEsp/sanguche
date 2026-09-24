import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VideoUrlState {
  url: string | null;
  type: "external" | "storage";
  isLoading: boolean;
  error: string | null;
}

interface SignedVideo {
  url: string;
  type: "external" | "storage";
  expires_at: string | null;
}

// get-course-video firma por 4 horas. La URL se reusa al volver a una lección
// (antes se pedía otra vez en cada cambio) y se renueva media hora antes de
// que venza, igual que el timer que había acá.
const SIGNED_URL_FRESH_MS = (4 * 60 - 30) * 60 * 1000;

export function useVideoUrl(
  lessonId: string,
  videoType: string | undefined,
  videoUrl: string
): VideoUrlState & { refresh: () => void } {
  // External videos: return URL directly without edge function call
  const isExternal = !videoType || videoType === "external";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["course-video-url", lessonId],
    queryFn: async (): Promise<SignedVideo> => {
      const { data, error } = await supabase.functions.invoke<SignedVideo>("get-course-video", {
        body: { lesson_id: lessonId },
      });
      if (error || !data) throw error ?? new Error("Sin URL de video");
      return data;
    },
    enabled: !!lessonId && !isExternal,
    staleTime: SIGNED_URL_FRESH_MS,
    gcTime: SIGNED_URL_FRESH_MS,
    // Con una URL vencida en caché, volver a la lección la renueva.
    refetchOnMount: true,
    refetchInterval: SIGNED_URL_FRESH_MS,
  });

  if (isExternal) {
    return { url: videoUrl, type: "external", isLoading: false, error: null, refresh: () => {} };
  }

  return {
    url: data?.url ?? null,
    type: data?.type ?? "storage",
    isLoading,
    error: isError ? "Error al obtener el video" : null,
    refresh: () => void refetch(),
  };
}
