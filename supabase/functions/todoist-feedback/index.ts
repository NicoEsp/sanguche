// Todoist Feedback Edge Function
// This function receives feedback from authenticated users and creates tasks in Todoist
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TODOIST_API_URL = "https://api.todoist.com/rest/v2/tasks";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type FeedbackPayload = {
  name?: unknown;
  email?: unknown;
  feedback?: unknown;
};

// Validation constants
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_FEEDBACK_LENGTH = 5000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const payload: FeedbackPayload = await req.json();
    const { name, email, feedback } = payload;

    // Validate required fields
    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(feedback)) {
      return new Response(
        JSON.stringify({ error: "Los campos de nombre, email y feedback son obligatorios." }),
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

    if (feedback.length > MAX_FEEDBACK_LENGTH) {
      return new Response(
        JSON.stringify({ error: `El feedback no puede exceder ${MAX_FEEDBACK_LENGTH} caracteres.` }),
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
    const sanitizedFeedback = sanitizeInput(feedback);

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
    console.log("Creating Todoist task to Inbox", {
      hasToken: !!todoistToken,
      route: "inbox",
      contentLength: `${sanitizedName}+${sanitizedEmail}`.length,
      feedbackLength: sanitizedFeedback.length,
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
        description: sanitizedFeedback,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      // Log detailed error for debugging (server-side only)
      console.error("Todoist API error - Full details", {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        route: "inbox",
        requestContent: `${sanitizedName}+${sanitizedEmail}`,
      });
      
      // Return generic user-friendly error (no technical details)
      return new Response(
        JSON.stringify({ 
          error: "No pudimos enviar tu feedback. Intenta nuevamente en unos minutos."
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
    console.error("Unexpected error handling Todoist feedback", error);
    return new Response(
      JSON.stringify({ error: "Error interno al enviar el feedback." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
