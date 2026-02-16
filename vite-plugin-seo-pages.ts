import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Vite plugin that generates per-route HTML files at build time
 * with unique meta tags for each public route.
 * 
 * This ensures crawlers see correct meta tags without needing
 * to execute JavaScript (solving SPA SEO issues).
 */
export function seoPages(): Plugin {
  return {
    name: 'seo-pages',
    apply: 'build',
    enforce: 'post',

    async closeBundle() {
      // Dynamic import to use ESM module from build context
      const { SEO_ROUTES } = await import('./src/seo/routes.ts');
      const distDir = path.resolve(__dirname, 'dist');
      const baseHtml = fs.readFileSync(path.resolve(distDir, 'index.html'), 'utf-8');

      for (const [routePath, seo] of Object.entries(SEO_ROUTES)) {
        // Skip root — it's already index.html
        if (routePath === '/') {
          const updatedRoot = injectMeta(baseHtml, seo);
          fs.writeFileSync(path.resolve(distDir, 'index.html'), updatedRoot);
          continue;
        }

        const dir = path.resolve(distDir, routePath.replace(/^\//, ''));
        fs.mkdirSync(dir, { recursive: true });

        const html = injectMeta(baseHtml, seo);
        fs.writeFileSync(path.resolve(dir, 'index.html'), html);
      }

      console.log(`✓ SEO pages generated for ${Object.keys(SEO_ROUTES).length} routes`);
    },
  };
}

interface SeoData {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  ogType?: string;
  image?: string;
  imageAlt?: string;
  jsonLd?: object | object[];
}

function injectMeta(html: string, seo: SeoData): string {
  let result = html;

  // Replace <title>
  result = result.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(seo.title)}</title>`
  );

  // Replace meta description
  result = result.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escapeAttr(seo.description)}">`
  );

  // Replace canonical
  result = result.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${escapeAttr(seo.canonical)}" />`
  );

  // Replace OG tags
  result = result.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escapeAttr(seo.title)}">`
  );
  result = result.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${escapeAttr(seo.description)}">`
  );
  result = result.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${escapeAttr(seo.canonical)}">`
  );
  if (seo.image) {
    result = result.replace(
      /<meta property="og:image" content="[^"]*">/,
      `<meta property="og:image" content="${escapeAttr(seo.image)}">`
    );
  }
  if (seo.imageAlt) {
    result = result.replace(
      /<meta property="og:image:alt" content="[^"]*">/,
      `<meta property="og:image:alt" content="${escapeAttr(seo.imageAlt)}">`
    );
  }

  // Replace Twitter tags
  result = result.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${escapeAttr(seo.title)}">`
  );
  result = result.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${escapeAttr(seo.description)}">`
  );

  // Add keywords if present (insert before </head>)
  if (seo.keywords) {
    result = result.replace(
      '</head>',
      `<meta name="keywords" content="${escapeAttr(seo.keywords)}">\n</head>`
    );
  }

  // Add JSON-LD if present (insert before </head>)
  if (seo.jsonLd) {
    const jsonLdString = JSON.stringify(seo.jsonLd);
    result = result.replace(
      '</head>',
      `<script type="application/ld+json">${jsonLdString}</script>\n</head>`
    );
  }

  // Update noscript content with page-specific h1 and description
  result = result.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript>
      <h1>${escapeHtml(seo.title)}</h1>
      <p>${escapeHtml(seo.description)}</p>
    </noscript>`
  );

  return result;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
