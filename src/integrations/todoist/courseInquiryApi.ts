import { supabase } from "@/integrations/supabase/client";

const TODOIST_FUNCTION_NAME = "todoist-course-inquiry";

interface CreateCourseInquiryParams {
  name: string;
  email: string;
  message: string;
  courseInterest: "estrategia" | "todos" | "general";
}

export async function createCourseInquiryTask({ 
  name, 
  email, 
  message,
  courseInterest 
}: CreateCourseInquiryParams) {
  if (!name.trim() || !email.trim() || !message.trim()) {
    throw new Error('Los campos de nombre, email y consulta son obligatorios.');
  }

  const { data, error } = await supabase.functions.invoke<{ success: boolean; error?: string }>(
    TODOIST_FUNCTION_NAME,
    {
      body: { name, email, message, courseInterest },
    },
  );

  if (error) {
    if (import.meta.env.DEV) console.error('Todoist API error:', error);
    throw new Error('No pudimos enviar tu consulta. Intenta nuevamente en unos minutos.');
  }

  if (!data?.success) {
    if (import.meta.env.DEV) console.error('Todoist API error:', data?.error);
    throw new Error('No pudimos enviar tu consulta. Intenta nuevamente en unos minutos.');
  }

  return data;
}
