import { supabase } from "@/integrations/supabase/client";
import { AnyAssessmentValues, AssessmentResult, AssessmentTypeKey } from "./scoring";

/**
 * Persiste la evaluación en Supabase. Lanza error si el guardado falla
 * para que la UI pueda avisar al usuario y permitir el reintento
 * (el resultado solo vive en el servidor).
 *
 * Cada usuario tiene una sola evaluación vigente: después de insertar la
 * nueva se borran las anteriores, sin importar de qué tipo eran.
 *
 * Lo único que se espera es el insert. Antes la función pedía el usuario al
 * servidor de auth (getUser), buscaba el perfil, insertaba y borraba en fila:
 * cuatro round trips con el spinner de "guardando" encima. El usuario ya lo
 * conoce la sesión, el perfil casi siempre está en caché, y la RLS de
 * assessments sigue validando que el perfil sea de quien inserta.
 */
export async function saveAssessment(
  userId: string,
  values: AnyAssessmentValues,
  result: AssessmentResult,
  assessmentType: AssessmentTypeKey,
  knownProfileId?: string
): Promise<{ createdAt: string }> {
  let profileId = knownProfileId;
  if (!profileId) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw profileError ?? new Error("No se encontró el perfil del usuario");
    }
    profileId = profile.id;
  }

  // Insertar primero y recién después borrar las anteriores: si el insert
  // falla, la evaluación previa sigue intacta. Si lo que falla es el borrado,
  // quedan filas viejas de más y los lectores igual toman la más reciente.
  const { data: inserted, error: insertError } = await supabase
    .from("assessments")
    .insert({
      user_id: profileId,
      assessment_values: values,
      assessment_result: result,
      assessment_type: assessmentType,
    })
    .select("id, created_at")
    .single();

  if (insertError || !inserted) {
    throw insertError ?? new Error("No se pudo guardar la evaluación");
  }

  // Sin esperar: nadie depende de este borrado para mostrar el resultado. El
  // then() hace falta igual, sin él el builder de supabase-js no envía nada.
  supabase
    .from("assessments")
    .delete()
    .eq("user_id", profileId)
    .neq("id", inserted.id)
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.error("No se pudieron borrar evaluaciones anteriores:", error);
      }
    });

  return { createdAt: inserted.created_at };
}
