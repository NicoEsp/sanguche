import { soyDevFaqs } from './faqs/soyDev';
import { empresasFaqs } from './faqs/empresas';
import { homeFaqs } from './faqs/home';
// SITE_URL vive en contentSeo.ts: una sola definición para build y cliente,
// así los canonical del HTML servido y los del router no pueden divergir.
import { SITE_URL } from './contentSeo';
import { evaluacionFaqs } from './faqs/evaluacion';

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


const DEFAULT_IMAGE = `${SITE_URL}/og-preview-v3.png`;
const DEFAULT_IMAGE_ALT = 'ProductPrepa - Plataforma para crecer en Producto';

export const SEO_ROUTES: Record<string, SeoRouteData> = {
  '/': {
    title: 'ProductPrepa - Plataforma para crecer en Producto',
    description: 'Aprendé Producto en una plataforma que combina Cursos, evaluación de habilidades, tu propio Career Path y mentoría personalizada.',
    canonical: `${SITE_URL}/`,
    keywords: 'product builder, product management, evaluación PM, seniority, carrera producto, evaluación profesional, desarrollo PM, mapa de afinidad producto, madurez de equipo de producto, evaluación para founders',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: homeFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  },

  '/evaluacion-product-manager': {
    title: 'Evaluación de Product Manager gratis | Descubrí tu nivel — ProductPrepa',
    description:
      'Evaluación gratuita de Product Manager en 5 minutos. Un radar con tus competencias de Producto, tus áreas de mejora y una recomendación a tu medida. Sin experiencia previa.',
    canonical: `${SITE_URL}/evaluacion-product-manager`,
    keywords:
      'evaluacion product manager, test product manager, autoevaluacion PM, evaluar habilidades product manager, nivel de seniority PM, diagnostico product manager',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: evaluacionFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Evaluación de Product Manager',
            item: `${SITE_URL}/evaluacion-product-manager`,
          },
        ],
      },
    ],
  },

  '/planes': {
    title: 'Planes y Precios | ProductPrepa',
    description: 'Elige el plan que mejor se adapte a tu momento. Desde evaluación gratuita hasta mentoría personalizada y cursos especializados.',
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
    title: 'De Dev a Product Builder — Aprender Producto en la era de la IA | ProductPrepa',
    description: 'Guía para developers que quieren crecer en Producto en la era de la IA. Evaluación gratuita, mentoría 1:1 con NicoProducto y un roadmap para la transición de dev a PM o side-projects.',
    canonical: `${SITE_URL}/soy-dev`,
    keywords: 'developer aprender product management, transición dev a PM, de software engineer a product manager, carrera tech en era IA, side project producto, dev mentalidad de producto, programador product builder, autoevaluación product manager dev, mentoría producto para desarrolladores',
    image: `${SITE_URL}/og-soy-dev.png`,
    imageAlt: 'Sos Dev. Aprender Producto es tu superpoder — ProductPrepa',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'De Dev a Product Builder — Aprender Producto en la era de la IA',
        description: 'Por qué aprender Product Management es clave para developers en la era de la IA. Evaluación, recursos curados y mentoría 1:1 para perfiles técnicos.',
        url: `${SITE_URL}/soy-dev`,
        inLanguage: 'es',
        isPartOf: { '@type': 'WebSite', name: 'ProductPrepa', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL },
        about: [
          { '@type': 'Thing', name: 'Product Management para developers' },
          { '@type': 'Thing', name: 'Transición de developer a Product Manager' },
          { '@type': 'Thing', name: 'Carrera profesional en software en la era de la IA' },
        ],
        audience: {
          '@type': 'Audience',
          audienceType: 'Software developers, engineers and technical founders',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Soy Dev', item: `${SITE_URL}/soy-dev` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': `${SITE_URL}/#nicoproducto`,
        name: 'Nicolás Espíndola',
        alternateName: 'NicoProducto',
        jobTitle: 'Product Mentor & Founder de ProductPrepa',
        description: 'Más de 10 años en Producto. Mentor y creador de ProductPrepa, ayudando a developers y perfiles técnicos a crecer en Product Management.',
        url: 'https://www.linkedin.com/in/nicolas-espindola/',
        sameAs: [
          'https://www.linkedin.com/in/nicolas-espindola/',
          'https://twitter.com/nicoproducto',
        ],
        worksFor: { '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL },
        knowsAbout: [
          'Product Management',
          'Product Discovery',
          'Priorización',
          'Métricas de producto',
          'Mentoría para developers en transición a Producto',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: 'Evaluación Product Builder para developers',
        description: 'Evaluación gratuita de 5 minutos diseñada para developers: identifica tu nivel de seniority en Producto y tus gaps específicos como perfil técnico.',
        url: `${SITE_URL}/autoevaluacion`,
        inLanguage: 'es',
        learningResourceType: 'Self-assessment',
        educationalLevel: 'Beginner to Advanced',
        educationalUse: 'Skill assessment',
        teaches: 'Product Management fundamentals para developers',
        audience: {
          '@type': 'EducationalAudience',
          educationalRole: 'Software developer',
        },
        provider: { '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL },
        author: { '@id': `${SITE_URL}/#nicoproducto` },
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: soyDevFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  },

  '/empresas': {
    title: 'Capacitación de Producto para equipos y empresas | ProductPrepa for Business',
    // Front-load del entregable concreto: Google corta la description cerca de
    // los 160 caracteres y el gancho ("3 sesiones en vivo") quedaba afuera.
    description: 'Capacitación en Producto a medida para tu equipo: diagnóstico, temario propio y hasta 3 sesiones grupales en vivo con NicoProducto. Estrategia, discovery, priorización e IA.',
    canonical: `${SITE_URL}/empresas`,
    keywords: 'capacitación product management empresas, formación de producto para equipos, taller product management in company, mentoría grupal producto, capacitación discovery y estrategia, ProductPrepa for Business, entrenamiento equipo de producto',
    image: `${SITE_URL}/og-empresas.png`,
    imageAlt: 'ProductPrepa for Business — Capacitación de Producto a medida para equipos',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'ProductPrepa for Business — Capacitación de Producto para equipos',
        description: 'Programa de capacitación en Producto a medida para equipos, áreas y líderes de empresas. Temario personalizado y sesiones grupales en vivo.',
        url: `${SITE_URL}/empresas`,
        inLanguage: 'es',
        isPartOf: { '@type': 'WebSite', name: 'ProductPrepa', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL },
        about: [
          { '@type': 'Thing', name: 'Capacitación en Product Management para equipos' },
          { '@type': 'Thing', name: 'Formación de producto para empresas' },
        ],
        audience: {
          '@type': 'Audience',
          audienceType: 'Empresas, equipos de producto y líderes de área',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${SITE_URL}/empresas#service`,
        name: 'ProductPrepa for Business',
        serviceType: 'Capacitación de Producto in-company a medida',
        description: 'Programa one-time de capacitación en Producto para equipos: diagnóstico, temario a medida y hasta 3 sesiones grupales en vivo con NicoProducto.',
        url: `${SITE_URL}/empresas`,
        inLanguage: 'es',
        provider: {
          '@type': 'Organization',
          name: 'ProductPrepa',
          url: SITE_URL,
          // Canal de contacto B2B: el mismo que la landing publica en las FAQ.
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'sales',
            email: 'nicoproducto@hey.com',
            availableLanguage: ['es'],
            areaServed: 'LATAM',
          },
        },
        areaServed: { '@type': 'Place', name: 'LATAM y remoto' },
        audience: {
          '@type': 'Audience',
          audienceType: 'Empresas y equipos de producto',
        },
        // Qué incluye el programa, en los mismos términos que la landing.
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Qué incluye ProductPrepa for Business',
          itemListElement: [
            'Diagnóstico inicial del equipo y de las áreas a fortalecer',
            'Temario a medida, armado sobre los desafíos actuales',
            'Hasta 3 sesiones grupales en vivo con el equipo',
            'Acceso de todo el equipo a los cursos de ProductPrepa',
            'Reporte de avance para el líder del área',
          ].map((name) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name },
          })),
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/empresas`,
          category: 'B2B training program',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Empresas', item: `${SITE_URL}/empresas` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: empresasFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  },

  '/autoevaluacion': {
    title: 'Evaluación Product Builder Gratis | Descubrí tu nivel',
    description: 'Evaluación gratuita de 5 minutos que se adapta a tu perfil y mide las competencias core de Producto. Identificá fortalezas, áreas de mejora y recibí un roadmap personalizado.',
    canonical: `${SITE_URL}/autoevaluacion`,
    keywords: 'evaluación product builder gratis, autoevaluación PM, nivel seniority PM, evaluación habilidades producto',
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
  },

  // Catálogo canónico de recursos. /preguntas redirige acá, así que sus
  // términos viven en estas keywords en vez de en una entrada propia.
  '/descargables': {
    title: 'Recursos Descargables para Product Builders | ProductPrepa',
    description: 'Catálogo de recursos descargables para crecer en Producto: guías, plantillas, checklists y PDFs prácticos. Filtrá por tipo y por nivel de acceso, y descargá lo que necesites.',
    canonical: `${SITE_URL}/descargables`,
    keywords: 'recursos product management, descargables PM, guías producto, plantillas producto, checklists product manager, materiales PM, preguntas de producto, templates product builder',
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
