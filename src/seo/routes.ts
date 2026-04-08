export interface SeoRouteData {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  ogType?: string;
  image?: string;
  imageAlt?: string;
  jsonLd?: object | object[];
}

const SITE_URL = 'https://productprepa.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-preview-v2.png`;
const DEFAULT_IMAGE_ALT = 'ProductPrepa - Plataforma para crecer en Producto';

export const SEO_ROUTES: Record<string, SeoRouteData> = {
  '/': {
    title: 'ProductPrepa - Plataforma para crecer en Producto',
    description: 'Aprendé Producto en una plataforma que combina Cursos, evaluación de habilidades, tu propio Career Path y mentoría personalizada.',
    canonical: `${SITE_URL}/`,
    keywords: 'product builder, product management, autoevaluación PM, seniority, carrera producto, evaluación profesional, desarrollo PM',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ProductPrepa',
        url: SITE_URL,
        description: 'Plataforma para crecer en Producto con cursos, evaluación y mentoría personalizada.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ProductPrepa',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.png`,
        sameAs: ['https://twitter.com/nicoproducto'],
      },
    ],
  },

  '/planes': {
    title: 'Planes y Precios | ProductPrepa',
    description: 'Elige el plan que mejor se adapte a tu momento. Desde autoevaluación gratuita hasta mentoría personalizada y cursos especializados.',
    canonical: `${SITE_URL}/planes`,
    keywords: 'precios productprepa, planes suscripción, premium PM, mentoría producto, cursos PM, mentoría product builder precio, curso PM con tutor, inversión formación producto',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/cursos-info': {
    title: 'Estrategia de Producto desde cero | Curso online - ProductPrepa',
    description: 'Curso de Estrategia de Producto para diseñadores, desarrolladores, Scrum Masters y Marketers. Framework de 6 dimensiones, videos cortos y ejercicios prácticos. Acceso de por vida.',
    canonical: `${SITE_URL}/cursos-info`,
    keywords: 'cursos product management, curso estrategia producto, formación PM, aprender producto, curso PM online',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/soy-dev': {
    title: 'Soy Dev - Por qué aprender Producto | ProductPrepa',
    description: 'Descubrí por qué aprender Producto es clave para desarrolladores. Evaluá tus habilidades y crecé profesionalmente.',
    canonical: `${SITE_URL}/soy-dev`,
    keywords: 'desarrollador producto, dev product management, programador PM, software developer product skills, carrera desarrollador',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Soy Dev - Por qué aprender Producto',
      description: 'Descubrí por qué aprender Producto es clave para desarrolladores.',
      url: `${SITE_URL}/soy-dev`,
      publisher: { '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL },
    },
  },

  '/preguntas': {
    title: 'Preguntas de Producto para hacerte — ProductPrepa',
    description: 'Un documento de disparadores para reflexionar sobre tu producto, tu equipo y cómo estás en tu rol actualmente.',
    canonical: `${SITE_URL}/preguntas`,
    keywords: 'preguntas producto, reflexión PM, preguntas product builder',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/autoevaluacion': {
    title: 'Autoevaluación Product Builder Gratis | Descubrí tu nivel',
    description: 'Test gratuito de 5 minutos para conocer tu nivel como Product Builder. Identificá fortalezas, áreas de mejora y recibí un roadmap personalizado.',
    canonical: `${SITE_URL}/autoevaluacion`,
    keywords: 'test product builder gratis, autoevaluación PM, nivel seniority PM, evaluación habilidades producto',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/mejoras': {
    title: 'Resultados de tu evaluación — ProductPrepa',
    description: 'Revisa tu desempeño completo: fortalezas y áreas de mejora identificadas.',
    canonical: `${SITE_URL}/mejoras`,
    keywords: 'gaps de producto, fortalezas PM, áreas de mejora, resultados evaluación, feedback producto',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/descargables': {
    title: 'Recursos Descargables | ProductPrepa',
    description: 'Descargá guías y recursos prácticos para crecer como Product Builder.',
    canonical: `${SITE_URL}/descargables`,
    keywords: 'recursos product management, descargables PM, guías producto, materiales PM',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/mentoria': {
    title: 'Mentoría personalizada — ProductPrepa',
    description: 'Descubrí mentoría curada para cerrar tus áreas de mejora en Producto.',
    canonical: `${SITE_URL}/mentoria`,
    keywords: 'mentoría PM, coaching producto, recomendaciones personalizadas, guía producto, mentor product builder',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/blog': {
    title: 'Blog de Producto | ProductPrepa',
    description: 'Artículos prácticos sobre Producto: cómo preparar entrevistas, diferencias de roles, métricas, estrategia y más.',
    canonical: `${SITE_URL}/blog`,
    keywords: 'blog product management, artículos PM, aprender producto, product builder consejos, carrera en producto',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
    ogType: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog de ProductPrepa',
      description: 'Artículos prácticos sobre Producto.',
      url: `${SITE_URL}/blog`,
      publisher: {
        '@type': 'Organization',
        name: 'ProductPrepa',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.png`,
      },
      inLanguage: 'es',
    },
  },

};
