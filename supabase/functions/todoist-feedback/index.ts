// Todoist Feedback Edge Function
// This function receives feedback from authenticated users and creates tasks in Todoist
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TODOIST_API_URL = "https://api.todoist.com/rest/v2/tasks";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FeedbackPayload = {
  name?: unknown;
  email?: unknown;
  feedback?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(feedback)) {
      return new Response(
        JSON.stringify({ error: "Los campos de nombre, email y feedback son obligatorios." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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

    const todoistProjectId = Deno.env.get("TODOIST_PROJECT_ID");
    if (!todoistProjectId) {
      console.error("TODOIST_PROJECT_ID environment variable is not set");
      return new Response(
        JSON.stringify({ error: "Todoist project ID no configurado." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const response = await fetch(TODOIST_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${todoistToken}`,
        "Content-Type": "application/json",
        "X-Request-Id": crypto.randomUUID(),
      },
      body: JSON.stringify({
        project_id: todoistProjectId,
        content: `${name}+${email}`,
        description: feedback,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Todoist API error", response.status, errorBody);
      return new Response(
        JSON.stringify({ error: errorBody || "No se pudo crear la tarea en Todoist." }),
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
