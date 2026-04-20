import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for auth validation
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Parse request
    const { lesson_id } = await req.json();
    if (!lesson_id || typeof lesson_id !== "string") {
      return new Response(JSON.stringify({ error: "lesson_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(lesson_id)) {
      return new Response(JSON.stringify({ error: "Invalid lesson_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for data access
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get lesson + course info
    const { data: lesson, error: lessonError } = await adminClient
      .from("course_lessons")
      .select("id, video_url, video_type, course_id, courses!inner(slug, is_free)")
      .eq("id", lesson_id)
      .single();

    if (lessonError || !lesson) {
      return new Response(JSON.stringify({ error: "Lesson not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const course = (lesson as any).courses;
    const courseSlug = course.slug;
    const isFree = course.is_free;

    // Check access: free courses → any authenticated user; paid → check plan
    if (!isFree) {
      // Check if user is admin
      const { data: isAdmin } = await adminClient.rpc("is_admin_jwt", {
        check_user_id: userId,
      });

      if (!isAdmin) {
        // Check course access via has_course_access
        const { data: hasAccess } = await userClient.rpc("has_course_access", {
          p_course_slug: courseSlug,
        });

        if (!hasAccess) {
          return new Response(JSON.stringify({ error: "No access to this course" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // If external video, return URL directly
    if (lesson.video_type === "external" || !lesson.video_type) {
      return new Response(
        JSON.stringify({
          url: lesson.video_url,
          type: "external",
          expires_at: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Storage video: generate signed URL (4 hours = 14400 seconds)
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from("course-videos")
      .createSignedUrl(lesson.video_url, 14400);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);
      return new Response(JSON.stringify({ error: "Failed to generate video URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(Date.now() + 14400 * 1000).toISOString();

    return new Response(
      JSON.stringify({
        url: signedUrlData.signedUrl,
        type: "storage",
        expires_at: expiresAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("get-course-video error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
