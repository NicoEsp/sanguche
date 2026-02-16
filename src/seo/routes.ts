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
const DEFAULT_IMAGE = `${SITE_URL}/social-image.png`;
const DEFAULT_IMAGE_ALT = 'ProductPrepa - Plataforma para crecer en Producto';

export const SEO_ROUTES: Record<string, SeoRouteData> = {
  '/': {
    title: 'ProductPrepa - Plataforma para crecer en Producto',
    description: 'Aprendé Producto en una plataforma que combina Cursos, evaluación de habilidades, tu propio Career Path y mentoría personalizada.',
    canonical: `${SITE_URL}/`,
    keywords: 'product management, autoevaluación PM, seniority, carrera producto, product manager, evaluación profesional, desarrollo PM',
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
    keywords: 'precios productprepa, planes suscripción, premium PM, mentoría producto, cursos PM, mentoría product manager precio, curso PM con tutor, inversión formación producto',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/cursos-info': {
    title: 'Cursos de Producto | Estrategia, Discovery y más - ProductPrepa',
    description: 'Aprende Estrategia de Producto con cursos cortos y prácticos. Videos de menos de 10 minutos, ejercicios aplicables y acceso de por vida. Ideal para principiantes.',
    canonical: `${SITE_URL}/cursos-info`,
    keywords: 'cursos product management, curso estrategia producto, formación PM, aprender producto, curso PM online',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/starterpack': {
    title: 'Starter Pack para Product Managers | ProductPrepa',
    description: 'Recursos curados y guía paso a paso para quienes comienzan en Product Management o dan el salto a liderar equipos de producto.',
    canonical: `${SITE_URL}/starterpack`,
    keywords: 'starter pack PM, recursos product management, guía PM principiante, comenzar en producto',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: 'Starter Pack para Product Managers',
      description: 'Recursos curados y guía paso a paso para quienes comienzan en Product Management o dan el salto a liderar equipos de producto.',
      provider: { '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL },
      educationalLevel: 'Beginner',
      url: `${SITE_URL}/starterpack`,
    },
  },

  '/starterpack/build': {
    title: 'Construir Productos - Starter Pack | ProductPrepa',
    description: 'Guía paso a paso con recursos curados para quienes comienzan en Product Management.',
    canonical: `${SITE_URL}/starterpack/build`,
    keywords: 'construir productos, PM principiante, guía product management',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/starterpack/lead': {
    title: 'Liderar Equipos - Starter Pack | ProductPrepa',
    description: 'Guía paso a paso para PMs que buscan dar el salto a roles de liderazgo como Lead PM, GPM o Head of Product.',
    canonical: `${SITE_URL}/starterpack/lead`,
    keywords: 'liderar equipos producto, lead PM, GPM, head of product, liderazgo PM',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/soy-dev': {
    title: 'Soy Dev - Por qué aprender Producto | ProductPrepa',
    description: 'Descubrí por qué aprender Product Management es clave para desarrolladores. Evaluá tus habilidades de producto y crecé profesionalmente.',
    canonical: `${SITE_URL}/soy-dev`,
    keywords: 'desarrollador producto, dev product management, programador PM, software developer product skills, carrera desarrollador',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Soy Dev - Por qué aprender Producto',
      description: 'Descubrí por qué aprender Product Management es clave para desarrolladores.',
      url: `${SITE_URL}/soy-dev`,
      publisher: { '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL },
    },
  },

  '/preguntas': {
    title: 'Preguntas de Producto para hacerte — ProductPrepa',
    description: 'Un documento de disparadores para reflexionar sobre tu producto, tu equipo y cómo estás en tu rol actualmente.',
    canonical: `${SITE_URL}/preguntas`,
    keywords: 'preguntas producto, reflexión PM, preguntas product manager',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  '/autoevaluacion': {
    title: 'Autoevaluación Product Manager Gratis | Descubre tu nivel PM',
    description: 'Test gratuito de 5 minutos para conocer tu nivel como Product Manager. Identifica fortalezas, áreas de mejora y recibe un roadmap personalizado.',
    canonical: `${SITE_URL}/autoevaluacion`,
    keywords: 'test product manager gratis, autoevaluación PM, nivel seniority PM, evaluación habilidades producto',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },
};
