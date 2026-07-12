import { supabase } from "@/integrations/supabase/client";
import { AnyAssessmentValues, AssessmentResult, AssessmentTypeKey } from "./scoring";

/**
 * Persiste la evaluación en Supabase. Lanza error si el guardado falla
 * para que la UI pueda avisar al usuario y permitir el reintento
 * (el resultado solo vive en el servidor).
 *
 * Cada usuario tiene una sola evaluación vigente: antes de insertar la nueva
 * se borra la anterior, sin importar de qué tipo era.
 */
export async function saveAssessment(
  values: AnyAssessmentValues,
  result: AssessmentResult,
  assessmentType: AssessmentTypeKey
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

  // Insertar primero y recién después borrar las anteriores: si el insert
  // falla, la evaluación previa sigue intacta. Si lo que falla es el borrado,
  // quedan filas viejas de más y los lectores igual toman la más reciente.
  const { data: inserted, error: insertError } = await supabase
    .from("assessments")
    .insert({
      user_id: profile.id,
      assessment_values: values,
      assessment_result: result,
      assessment_type: assessmentType,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    throw insertError ?? new Error("No se pudo guardar la evaluación");
  }

  const { error: deleteError } = await supabase
    .from("assessments")
    .delete()
    .eq("user_id", profile.id)
    .neq("id", inserted.id);

  if (deleteError && import.meta.env.DEV) {
    console.error("No se pudieron borrar evaluaciones anteriores:", deleteError);
  }
}
