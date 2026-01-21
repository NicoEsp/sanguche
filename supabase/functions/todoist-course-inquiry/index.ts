// Todoist Course Inquiry Edge Function
// This function receives course inquiries and creates tasks in Todoist Inbox with "consulta-cursos" label
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TODOIST_API_URL = "https://api.todoist.com/rest/v2/tasks";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CourseInquiryPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  courseInterest?: unknown;
};

// Validation constants
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_MESSAGE_LENGTH = 5000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COURSE_LABELS: Record<string, string> = {
  estrategia: "Estrategia de Producto",
  todos: "Todos los cursos",
  general: "Consulta general",
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeInput(str: string): string {
  // Remove potential HTML/script tags for safety
  return str.replace(/[<>]/g, '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const payload: CourseInquiryPayload = await req.json();
    const { name, email, message, courseInterest } = payload;

    // Validate required fields
    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(message)) {
      return new Response(
        JSON.stringify({ error: "Los campos de nombre, email y consulta son obligatorios." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate field lengths
    if (name.length > MAX_NAME_LENGTH) {
      return new Response(
        JSON.stringify({ error: `El nombre no puede exceder ${MAX_NAME_LENGTH} caracteres.` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return new Response(
        JSON.stringify({ error: `El email no puede exceder ${MAX_EMAIL_LENGTH} caracteres.` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `La consulta no puede exceder ${MAX_MESSAGE_LENGTH} caracteres.` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return new Response(
        JSON.stringify({ error: "El formato del email no es válido." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedMessage = sanitizeInput(message);
    const courseLabel = typeof courseInterest === "string" && COURSE_LABELS[courseInterest]
      ? COURSE_LABELS[courseInterest]
      : "No especificado";

    const todoistToken = Deno.env.get("TODOIST_API_TOKEN");
    if (!todoistToken) {
      console.error("TODOIST_API_TOKEN environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Todoist API token no configurado." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Log diagnostic information before making the request
    console.log("Creating Todoist course inquiry task", {
      hasToken: !!todoistToken,
      courseInterest: courseLabel,
      contentLength: `${sanitizedName}+${sanitizedEmail}`.length,
      messageLength: sanitizedMessage.length,
    });

    const response = await fetch(TODOIST_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${todoistToken}`,
        "Content-Type": "application/json",
        "X-Request-Id": crypto.randomUUID(),
      },
      body: JSON.stringify({
        content: `${sanitizedName}+${sanitizedEmail}`,
        description: `**Curso de interés:** ${courseLabel}\n\n${sanitizedMessage}`,
        labels: ["consulta-cursos"],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      // Log detailed error for debugging (server-side only)
      console.error("Todoist API error - Full details", {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        requestContent: `${sanitizedName}+${sanitizedEmail}`,
      });
      
      // Return generic user-friendly error (no technical details)
      return new Response(
        JSON.stringify({ 
          error: "No pudimos enviar tu consulta. Intenta nuevamente en unos minutos."
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error handling course inquiry", error);
    return new Response(
      JSON.stringify({ error: "Error interno al enviar la consulta." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
