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
    console.error('Todoist API error:', error);
    throw new Error('No pudimos enviar tu feedback. Intenta nuevamente en unos minutos.');
  }

  if (!data?.success) {
    console.error('Todoist API error:', data?.error);
    throw new Error('No pudimos enviar tu feedback. Intenta nuevamente en unos minutos.');
  }

  return data;
}
