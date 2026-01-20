import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_URL = 'https://productprepa.com'

// Public static routes (not auth-protected)
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/planes', priority: '0.9', changefreq: 'weekly' },
  { path: '/preguntas', priority: '0.8', changefreq: 'monthly' },
  { path: '/starterpack', priority: '0.8', changefreq: 'monthly' },
  { path: '/starterpack/build', priority: '0.7', changefreq: 'monthly' },
  { path: '/starterpack/lead', priority: '0.7', changefreq: 'monthly' },
  { path: '/cursos', priority: '0.8', changefreq: 'weekly' },
  { path: '/auth', priority: '0.5', changefreq: 'monthly' },
]

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  // Fetch published courses
  const { data: courses } = await supabase
    .from('courses')
    .select('slug, updated_at')
    .eq('status', 'published')

  const today = new Date().toISOString().split('T')[0]

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

  // Add static routes
  for (const route of STATIC_ROUTES) {
    xml += `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`
  }

  // Add dynamic course routes
  if (courses) {
    for (const course of courses) {
      const lastmod = course.updated_at?.split('T')[0] || today
      xml += `  <url>
    <loc>${SITE_URL}/cursos/${course.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
    }
  }

  xml += `</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache 1 hour
    }
  })
})
