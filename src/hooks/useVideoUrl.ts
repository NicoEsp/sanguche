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
    // Medido desde que se firmó la URL y no desde el montaje: con una URL
    // reusada de la caché, un intervalo fijo dejaba pasar el vencimiento. Sin
    // URL (el primer pedido falló, por ejemplo un 403) no hay intervalo.
    refetchInterval: (query) =>
      query.state.data
        ? Math.max(SIGNED_URL_FRESH_MS - (Date.now() - query.state.dataUpdatedAt), 1000)
        : false,
  });

  if (isExternal) {
    return { url: videoUrl, type: "external", isLoading: false, error: null, refresh: () => {} };
  }

  return {
    url: data?.url ?? null,
    type: data?.type ?? "storage",
    isLoading,
    // Si falla la renovación periódica, la URL anterior sigue vigente media
    // hora más: el error solo se muestra si no hay ninguna (si no, el
    // reproductor cortaba el video en curso).
    error: isError && !data ? "Error al obtener el video" : null,
    refresh: () => void refetch(),
  };
}
