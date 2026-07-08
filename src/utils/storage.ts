import { supabase } from "@/integrations/supabase/client";
import { AssessmentResult, AssessmentValues } from "./scoring";

/**
 * Persiste la evaluación en Supabase. Lanza error si el guardado falla
 * para que la UI pueda avisar al usuario y permitir el reintento
 * (el historial de assessments solo vive en el servidor).
 */
export async function saveAssessment(
  values: AssessmentValues,
  result: AssessmentResult
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw userError ?? new Error("No hay usuario autenticado");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    throw profileError ?? new Error("No se encontró el perfil del usuario");
  }

  const { error: insertError } = await supabase.from("assessments").insert({
    user_id: profile.id,
    assessment_values: values,
    assessment_result: result,
  });

  if (insertError) {
    throw insertError;
  }
}
