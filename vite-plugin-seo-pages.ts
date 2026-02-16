import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

interface SeoData {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  image?: string;
  imageAlt?: string;
  jsonLd?: object | object[];
}

const SITE_URL = 'https://productprepa.com';
const DEFAULT_IMAGE = `${SITE_URL}/social-image.png`;
const DEFAULT_IMAGE_ALT = 'ProductPrepa - Plataforma para crecer en Producto';

const SEO_ROUTES: Record<string, SeoData> = {
  '/': {
    title: 'ProductPrepa - Plataforma para crecer en Producto',
    description: 'Aprendé Producto en una plataforma que combina Cursos, evaluación de habilidades, tu propio Career Path y mentoría personalizada.',
    canonical: `${SITE_URL}/`,
    keywords: 'product management, autoevaluación PM, seniority, carrera producto, product manager, evaluación profesional, desarrollo PM',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: 'ProductPrepa', url: SITE_URL, description: 'Plataforma para crecer en Producto con cursos, evaluación y mentoría personalizada.' },
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL, logo: `${SITE_URL}/favicon.png`, sameAs: ['https://twitter.com/nicoproducto'] },
    ],
  },
  '/planes': {
    title: 'Planes y Precios | ProductPrepa',
    description: 'Elige el plan que mejor se adapte a tu momento. Desde autoevaluación gratuita hasta mentoría personalizada y cursos especializados.',
    canonical: `${SITE_URL}/planes`,
    keywords: 'precios productprepa, planes suscripción, premium PM, mentoría producto, cursos PM',
    image: DEFAULT_IMAGE, imageAlt: DEFAULT_IMAGE_ALT,
  },
  '/cursos-info': {
    title: 'Cursos de Producto | Estrategia, Discovery y más - ProductPrepa',
    description: 'Aprende Estrategia de Producto con cursos cortos y prácticos. Videos de menos de 10 minutos, ejercicios aplicables y acceso de por vida.',
    canonical: `${SITE_URL}/cursos-info`,
    keywords: 'cursos product management, curso estrategia producto, formación PM, aprender producto',
    image: DEFAULT_IMAGE, imageAlt: DEFAULT_IMAGE_ALT,
  },
  '/starterpack': {
    title: 'Starter Pack para Product Managers | ProductPrepa',
    description: 'Recursos curados y guía paso a paso para quienes comienzan en Product Management o dan el salto a liderar equipos de producto.',
    canonical: `${SITE_URL}/starterpack`,
    keywords: 'starter pack PM, recursos product management, guía PM principiante',
    image: DEFAULT_IMAGE, imageAlt: DEFAULT_IMAGE_ALT,
  },
  '/starterpack/build': {
    title: 'Construir Productos - Starter Pack | ProductPrepa',
    description: 'Guía paso a paso con recursos curados para quienes comienzan en Product Management.',
    canonical: `${SITE_URL}/starterpack/build`,
    keywords: 'construir productos, PM principiante, guía product management',
    image: DEFAULT_IMAGE, imageAlt: DEFAULT_IMAGE_ALT,
  },
  '/starterpack/lead': {
    title: 'Liderar Equipos - Starter Pack | ProductPrepa',
    description: 'Guía paso a paso para PMs que buscan dar el salto a roles de liderazgo como Lead PM, GPM o Head of Product.',
    canonical: `${SITE_URL}/starterpack/lead`,
    keywords: 'liderar equipos producto, lead PM, GPM, head of product',
    image: DEFAULT_IMAGE, imageAlt: DEFAULT_IMAGE_ALT,
  },
  '/soy-dev': {
    title: 'Soy Dev - Por qué aprender Producto | ProductPrepa',
    description: 'Descubrí por qué aprender Product Management es clave para desarrolladores. Evaluá tus habilidades de producto y crecé profesionalmente.',
    canonical: `${SITE_URL}/soy-dev`,
    keywords: 'desarrollador producto, dev product management, programador PM',
    image: DEFAULT_IMAGE, imageAlt: DEFAULT_IMAGE_ALT,
  },
  '/preguntas': {
    title: 'Preguntas de Producto para hacerte — ProductPrepa',
    description: 'Un documento de disparadores para reflexionar sobre tu producto, tu equipo y cómo estás en tu rol actualmente.',
    canonical: `${SITE_URL}/preguntas`,
    keywords: 'preguntas producto, reflexión PM, preguntas product manager',
    image: DEFAULT_IMAGE, imageAlt: DEFAULT_IMAGE_ALT,
  },
  '/autoevaluacion': {
    title: 'Autoevaluación Product Manager Gratis | Descubre tu nivel PM',
    description: 'Test gratuito de 5 minutos para conocer tu nivel como Product Manager. Identifica fortalezas, áreas de mejora y recibe un roadmap personalizado.',
    canonical: `${SITE_URL}/autoevaluacion`,
    keywords: 'test product manager gratis, autoevaluación PM, nivel seniority PM',
    image: DEFAULT_IMAGE, imageAlt: DEFAULT_IMAGE_ALT,
  },
};

/**
 * Vite plugin that generates per-route HTML files at build time
 * with unique meta tags for each public route.
 */
export function seoPages(): Plugin {
  return {
    name: 'seo-pages',
    apply: 'build',
    enforce: 'post',

    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      const indexPath = path.resolve(distDir, 'index.html');

      if (!fs.existsSync(indexPath)) {
        console.warn('⚠ seo-pages: dist/index.html not found, skipping');
        return;
      }

      const baseHtml = fs.readFileSync(indexPath, 'utf-8');

      for (const [routePath, seo] of Object.entries(SEO_ROUTES)) {
        if (routePath === '/') {
          fs.writeFileSync(indexPath, injectMeta(baseHtml, seo));
          continue;
        }

        const dir = path.resolve(distDir, routePath.replace(/^\//, ''));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.resolve(dir, 'index.html'), injectMeta(baseHtml, seo));
      }

      console.log(`✓ SEO pages generated for ${Object.keys(SEO_ROUTES).length} routes`);
    },
  };
}

function injectMeta(html: string, seo: SeoData): string {
  let result = html;

  result = result.replace(/<title>[^<]*<\/title>/, `<title>${esc(seo.title)}</title>`);
  result = result.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${attr(seo.description)}">`);
  result = result.replace(/<link rel="canonical" href="[^"]*"[^>]*>/, `<link rel="canonical" href="${attr(seo.canonical)}" />`);

  // OG
  result = result.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${attr(seo.title)}">`);
  result = result.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${attr(seo.description)}">`);
  result = result.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${attr(seo.canonical)}">`);
  if (seo.image) result = result.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${attr(seo.image)}">`);
  if (seo.imageAlt) result = result.replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${attr(seo.imageAlt)}">`);

  // Twitter
  result = result.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${attr(seo.title)}">`);
  result = result.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${attr(seo.description)}">`);

  // Keywords before </head>
  if (seo.keywords) {
    result = result.replace('</head>', `<meta name="keywords" content="${attr(seo.keywords)}">\n</head>`);
  }

  // JSON-LD before </head>
  if (seo.jsonLd) {
    result = result.replace('</head>', `<script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>\n</head>`);
  }

  // Update noscript
  result = result.replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript><h1>${esc(seo.title)}</h1><p>${esc(seo.description)}</p></noscript>`);

  return result;
}

function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function attr(s: string) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
