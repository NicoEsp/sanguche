import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking for scheduled blog posts to publish...');

    const now = new Date().toISOString();
    const { data: postsToPublish, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, scheduled_at')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .not('scheduled_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError);
      throw fetchError;
    }

    if (!postsToPublish || postsToPublish.length === 0) {
      console.log('No blog posts scheduled for publication at this time');
      return new Response(
        JSON.stringify({ message: 'No posts to publish', published: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${postsToPublish.length} post(s) to publish:`, postsToPublish.map(p => p.title));

    const publishedPosts = [];
    for (const post of postsToPublish) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          status: 'published',
          published_at: post.scheduled_at,
          scheduled_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateError) {
        console.error(`Error publishing post ${post.id}:`, updateError);
      } else {
        console.log(`Successfully published post: ${post.title}`);
        publishedPosts.push({ id: post.id, title: post.title });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Published ${publishedPosts.length} post(s)`,
        published: publishedPosts.length,
        posts: publishedPosts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in publish-scheduled-blog:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
