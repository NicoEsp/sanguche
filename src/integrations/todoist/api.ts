import { supabase } from "@/integrations/supabase/client";

const TODOIST_FUNCTION_NAME = "todoist-feedback";

interface CreateFeedbackTaskParams {
  name: string;
  email: string;
  feedback: string;
}

export async function createTodoistFeedbackTask({ name, email, feedback }: CreateFeedbackTaskParams) {
  if (!name.trim() || !email.trim() || !feedback.trim()) {
    throw new Error('Los campos de nombre, email y feedback son obligatorios.');
  }

  const { data, error } = await supabase.functions.invoke<{ success: boolean; error?: string }>(
    TODOIST_FUNCTION_NAME,
    {
      body: { name, email, feedback },
    },
  );

  if (error) {
    throw new Error(error.message || 'No se pudo crear la tarea en Todoist.');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'No se pudo crear la tarea en Todoist.');
  }

  return data;
}
