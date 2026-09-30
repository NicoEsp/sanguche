/**
 * send-fetita-invite: el mail que invita a una persona de la beta a probar Fetita.
 *
 * POST { user_id } invita a esa persona. POST { all: true } invita a todas las
 * que tienen acceso y todavía no recibieron la invitación. Sólo admins.
 *
 * Cada persona recibe la invitación una vez (fetita_invite_queue). El acceso a
 * Fetita se da aparte, con el botón Fetita de /admin/usuarios: acá sólo se
 * invita a quienes ya lo tienen.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { ctaButton, emailShell, escapeHtml, firstNameFrom, sendResendEmail, SITE_URL } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ?src=invitacion llega a Mixpanel como entry_point de fetita_started.
const FETITA_URL = `${SITE_URL}/fetita?src=invitacion`;
const MASCOT_URL = `${SITE_URL}/brand/fetita/mascota.png`;
const SUBJECT = "Te invito a probar Fetita, ahora en beta";
// Una invitación que lleva más que esto en "pending" viene de un envío que se cortó: se puede retomar.
// La función corta a los 150 s, así que 10 minutos alcanzan para no pisar un envío en curso.
const STALE_PENDING_MS = 10 * 60_000;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function buildEmailHtml(name: string | null): string {
  const p = 'style="font-size:16px;color:#27272a;line-height:1.6;margin:0 0 16px;"';
  return emailShell(
    SUBJECT,
    `<tr><td style="padding:40px;">
  <p style="text-align:center;margin:0 0 24px;">
    <img src="${MASCOT_URL}" width="160" alt="Fetita" style="display:inline-block;height:auto;border:0;"/>
  </p>
  <p ${p}>¡Hola ${escapeHtml(firstNameFrom(name))}!</p>
  <p ${p}>
    Te doy acceso a <strong>Fetita</strong>, el agente de ProductPrepa que desafía tus decisiones de producto.
    Ya leyó tu autoevaluación y te acompaña en una conversación de unos 10 minutos: primero contás tu contexto,
    después trabajan una decisión o un discovery real tuyo, y cierra con un veredicto y un próximo paso.
  </p>
  <p ${p}>
    Fetita está en <strong>etapa de pruebas</strong>: todavía puede equivocarse y va a ir cambiando.
    Por eso tu feedback me sirve un montón para mejorarla. Al final de la conversación vas a ver
    un pulgar para decirme si te sirvió el cierre, y si querés contarme más, respondé este mail.
  </p>
  <p ${p}>
    Tenés 2 conversaciones: una para probar y otra por si querés arrancar de nuevo con otro tema.
    Tené a mano una decisión real, sin datos confidenciales de tu empresa. Las conversaciones se guardan para mejorar Fetita.
  </p>
  ${ctaButton(FETITA_URL, "Probar Fetita →")}
  <p style="font-size:16px;color:#27272a;line-height:1.6;margin:0;">Gracias por ayudarme a construirla.<br/>Nico</p>
</td></tr>`,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Usá POST." });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) return json(500, { error: "Falta RESEND_API_KEY." });

  // Sólo admins.
  const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  const { data: auth } = token ? await supabase.auth.getUser(token) : { data: null };
  if (!auth?.user) return json(401, { error: "Iniciá sesión." });
  const { data: caller } = await supabase.from("profiles").select("id").eq("user_id", auth.user.id).maybeSingle();
  const { data: adminRole } = caller
    ? await supabase.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").limit(1).maybeSingle()
    : { data: null };
  if (!adminRole) return json(403, { error: "Sólo para admins." });

  const body = await req.json().catch(() => ({}));
  const userId = typeof body?.user_id === "string" ? body.user_id : null;
  if (!userId && body?.all !== true) return json(400, { error: "Mandá user_id o all: true." });

  // Sólo a quienes ya tienen acceso a Fetita.
  let accessQuery = supabase.from("fetita_access").select("user_id");
  if (userId) accessQuery = accessQuery.eq("user_id", userId);
  const { data: access, error: accessError } = await accessQuery;
  if (accessError) return json(500, { error: "No pudimos leer los accesos." });
  if (userId && !access?.length) return json(409, { error: "Esa persona todavía no tiene acceso a Fetita." });

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", (access ?? []).map((row) => row.user_id));
  if (profilesError) return json(500, { error: "No pudimos leer los perfiles." });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const profile of profiles ?? []) {
    if (!profile.email) {
      skipped++;
      continue;
    }

    // Se reclama la fila antes de mandar. Si ya existe, se retoma sólo lo que quedó en error o cortado.
    const claim = await supabase.from("fetita_invite_queue").insert({
      user_id: profile.id,
      email: profile.email,
      status: "pending",
    });
    if (claim.error) {
      if (claim.error.code !== "23505") {
        errors.push(`${profile.email}: ${claim.error.message}`);
        continue;
      }
      // Se retoma si quedó en error o si un envío se cortó antes de anotar el resultado.
      // El update es atómico: si otra llamada ya lo tomó, no devuelve la fila.
      const staleBefore = new Date(Date.now() - STALE_PENDING_MS).toISOString();
      const { data: retried } = await supabase
        .from("fetita_invite_queue")
        .update({ status: "pending", error_message: null, created_at: new Date().toISOString() })
        .eq("user_id", profile.id)
        .or(`status.eq.error,and(status.eq.pending,created_at.lt.${staleBefore})`)
        .select("user_id");
      if (!retried?.length) {
        skipped++;
        continue;
      }
    }

    const result = await sendResendEmail({
      apiKey: resendApiKey,
      to: profile.email,
      subject: SUBJECT,
      html: buildEmailHtml(profile.name),
      // Si se retoma un envío dudoso, Resend no manda el mail dos veces.
      idempotencyKey: `fetita-invite-${profile.id}`,
    });

    // El resultado se anota con un reintento. Sin esto la fila queda en "pending" y no se sabría qué pasó.
    const outcome = result.ok
      ? { status: "sent", sent_at: new Date().toISOString() }
      : { status: "error", error_message: result.body.slice(0, 1000) };
    let recorded = false;
    for (let attempt = 0; attempt < 2 && !recorded; attempt++) {
      const { error } = await supabase.from("fetita_invite_queue").update(outcome).eq("user_id", profile.id);
      recorded = !error;
    }

    if (!recorded) {
      errors.push(
        `${profile.email}: ${result.ok ? "el mail salió" : "el mail falló"}, pero no se pudo guardar el estado`,
      );
    } else if (result.ok) {
      sent++;
    } else {
      errors.push(`${profile.email}: ${result.status}`);
    }
  }

  console.log(`[send-fetita-invite] enviados: ${sent}, salteados: ${skipped}, errores: ${errors.length}`);
  return json(200, { sent, skipped, errors });
});
