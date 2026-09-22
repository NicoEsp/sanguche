/**
 * fetita-evaluate: corre a pedido el juez de alucinaciones sobre un memo.
 *
 * Lo usa el admin para reevaluar un memo (por ejemplo, si el check automático
 * que corre al guardarlo falló). Sólo admin: se valida con is_admin_jwt usando
 * el JWT de quien llama, igual que el resto del panel.
 *
 * POST { memo_id }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { z } from "npm:zod@3.25.76";
import { createAnthropic, readConfig } from "../_shared/fetita/config.ts";
import { runMemoCheck } from "../_shared/fetita/judge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RequestBody = z.object({ memo_id: z.string().uuid() });

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "metodo_invalido" });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "no_autenticado" });

  // is_admin_jwt lee el email del JWT: tiene que correr con el token de quien llama.
  const asCaller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: isAdmin, error: adminError } = await asCaller.rpc("is_admin_jwt");
  if (adminError || isAdmin !== true) return json(403, { error: "solo_admin" });

  let memoId: string;
  try {
    const parsed = RequestBody.safeParse(await req.json());
    if (!parsed.success) return json(400, { error: "entrada_invalida" });
    memoId = parsed.data.memo_id;
  } catch {
    return json(400, { error: "entrada_invalida" });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const outcome = await runMemoCheck({
      supabase,
      anthropic: createAnthropic(),
      model: readConfig().auxModel,
      memoId,
    });
    return json(outcome.status === "ok" ? 200 : 502, outcome);
  } catch (error) {
    console.error("[fetita-evaluate]", error);
    return json(500, { error: "error_interno" });
  }
});
