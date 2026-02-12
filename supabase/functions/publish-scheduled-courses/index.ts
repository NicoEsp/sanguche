import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for scheduled courses to publish...');
    
    // Find courses ready to publish
    const now = new Date().toISOString();
    const { data: coursesToPublish, error: fetchError } = await supabase
      .from('courses')
      .select('id, title, publish_at')
      .eq('status', 'coming_soon')
      .lte('publish_at', now)
      .not('publish_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching scheduled courses:', fetchError);
      throw fetchError;
    }

    if (!coursesToPublish || coursesToPublish.length === 0) {
      console.log('No courses scheduled for publication at this time');
      return new Response(
        JSON.stringify({ message: 'No courses to publish', published: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${coursesToPublish.length} course(s) to publish:`, coursesToPublish.map(c => c.title));

    // Publish each course
    const publishedCourses = [];
    for (const course of coursesToPublish) {
      const { error: updateError } = await supabase
        .from('courses')
        .update({ 
          status: 'published', 
          is_published: true,
          publish_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', course.id);

      if (updateError) {
        console.error(`Error publishing course ${course.id}:`, updateError);
      } else {
        console.log(`Successfully published course: ${course.title}`);
        publishedCourses.push({ id: course.id, title: course.title });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Published ${publishedCourses.length} course(s)`,
        published: publishedCourses.length,
        courses: publishedCourses
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in publish-scheduled-courses:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
