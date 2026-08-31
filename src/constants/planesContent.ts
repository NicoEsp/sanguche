/**
 * Contenido de la página de planes: nombres, descripciones, features y FAQs.
 *
 * Existe porque el mismo contenido lo necesitan tres consumidores que antes lo
 * tenían cada uno por su lado:
 *   - src/pages/Planes.tsx, la página interactiva
 *   - src/components/planes/PlanesSeoContent.tsx, la versión estática que el
 *     build escribe dentro del HTML servido
 *   - el JSON-LD (Offer + FAQPage), que se arma en los dos lugares
 *
 * Es un módulo puro a propósito: sin React, sin hooks y sin el cliente de
 * Supabase, porque lo importa el prerender en Node (ver scripts/prerender/).
 * Si le agregás un import que toque window o localStorage, rompés el build.
 */

export interface PlanFeature {
  text: string;
  /** Se resalta en la página interactiva. */
  strong?: boolean;
}

export interface SubscriptionPlanDef {
  key: 'gratuito' | 'premium' | 'repremium';
  name: string;
  description: string;
  /** Clave del precio en pricing-config; sin esto, el plan es gratis. */
  priceKey?: 'premium' | 'repremium';
  features: PlanFeature[];
  /** Cupo de mentoría: es una condición del plan, no un beneficio extra. */
  sessionsNote?: string;
  /** Descripción del servicio para el JSON-LD de Offer. */
  offerDescription?: string;
}

// El texto "NicoProducto" se enlaza a su LinkedIn donde aparezca; la página lo
// resuelve al renderizar, así que acá viaja como texto plano.
export const NICO_LINKEDIN_URL = 'https://www.linkedin.com/in/nicolas-espindola/';
export const NICO_NAME = 'NicoProducto';

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlanDef[] = [
  {
    key: 'gratuito',
    name: 'Plan Gratuito',
    description: 'Ideal para dar el primer paso',
    features: [
      { text: 'Autoevaluación completa de habilidades PM' },
      { text: 'Identificación de áreas de mejora' },
      { text: 'Recursos introductorios' },
      { text: 'PDFs y guías gratuitas' },
    ],
  },
  {
    key: 'premium',
    name: 'Plan Premium',
    description: 'Pensado para quienes quieren crecer en serio',
    priceKey: 'premium',
    features: [
      { text: 'Todo lo incluido en el plan gratuito' },
      { text: `Sesión mensual 1:1 con ${NICO_NAME}` },
      { text: 'Tu Career Path con objetivos concretos' },
      { text: 'Recursos curados según tus áreas de mejora' },
      { text: 'Nuevos contenidos cada mes' },
    ],
    sessionsNote: '1 sesión de mentoría por mes, no acumulable',
    offerDescription: 'Sesión mensual 1:1, Career Path personalizado, recursos curados',
  },
  {
    key: 'repremium',
    name: 'Plan RePremium',
    description: 'Para quienes buscan el máximo acompañamiento',
    priceKey: 'repremium',
    features: [
      { text: 'Todo lo incluido en Premium' },
      { text: `2 sesiones mensuales 1:1 con ${NICO_NAME}` },
      { text: 'Acceso completo a Cursos', strong: true },
      { text: 'Prioridad para agendar sesión' },
      { text: 'Feedback personalizado en ejercicios' },
      { text: 'Acceso prioritario a nuevos contenidos' },
      { text: 'Canal directo de comunicación' },
    ],
    sessionsNote: '2 sesiones de mentoría por mes, no acumulables',
    offerDescription: 'Todo Premium + 2 sesiones mensuales + acceso a todos los cursos',
  },
];

/** Productos de pago único, que no son la suscripción. */
export const PRODUCTASTIC_REVIEW = {
  name: 'Productastic Review',
  badge: 'Pago único',
  sectionTitle: '¿Ya tenés tu propio producto?',
  sectionSubtitle: 'Validá tus decisiones con alguien externo y con experiencia',
  price: 'ARS $100.000',
  priceNote: 'Precio de lanzamiento',
  // Dos líneas separadas: la página las muestra con un <br /> y el HTML
  // estático las une con un espacio.
  descriptionLines: [
    '¿Tomaste decisiones de producto y querés validarlas con alguien externo?',
    'Reviso tu research, hipótesis y decisiones hasta acá. No importa cómo construiste tu producto, analizo tu proceso hasta acá.',
  ],
  features: [
    { text: 'Revisión de tu research y hallazgos clave', highlight: true },
    { text: 'Análisis de hipótesis y decisiones de producto', highlight: true },
    { text: 'Feedback sobre flujos críticos y priorización', highlight: false },
    { text: 'Informe detallado en 72 hs', highlight: false },
    { text: 'Recomendaciones accionables paso a paso', highlight: false },
  ],
} as const;

export const B2B_PROGRAM = {
  name: 'ProductPrepa for B2B',
  badge: 'Para equipos',
  sectionTitle: '¿Trabajás en una empresa con equipo de Producto?',
  sectionSubtitle: 'Capacitá a todo el equipo con un programa hecho a medida del contexto de tu compañía',
  descriptionLines: [
    'Programa de capacitación a medida para equipos de Producto.',
    'Diagnóstico inicial, plan de trabajo y sesiones grupales en vivo, adaptado al contexto de tu empresa.',
  ],
  features: [
    { text: 'Diagnóstico inicial del equipo y áreas de mejora', highlight: true },
    { text: 'Plan de capacitación a medida (estrategia, discovery, ejecución)', highlight: true },
    { text: 'Sesiones grupales en vivo con el equipo', highlight: false },
    { text: 'Acceso de todo el equipo a los cursos', highlight: false },
    { text: 'Reportes de avance al líder del área', highlight: false },
  ],
} as const;

export const PLANES_FAQS: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: '¿Puedo cancelar mi suscripción cuando quiera?',
    answer:
      'Sí, todos los planes de suscripción se pueden cancelar en cualquier momento desde tu perfil. No hay compromisos de permanencia.',
  },
  {
    question: '¿Qué incluye la mentoría 1:1?',
    answer:
      'Cada mes tendrás una sesión de 45 minutos con NicoProducto donde revisamos tu progreso, definimos objetivos concretos y trabajamos en tus áreas de mejora específicas.',
  },
  {
    question: '¿Qué diferencia hay entre Premium y RePremium?',
    answer:
      'RePremium incluye todo lo de Premium más 2 sesiones mensuales en lugar de 1, acceso completo a todos los cursos, feedback personalizado en ejercicios y un canal directo de comunicación.',
  },
  {
    question: '¿Cómo funciona el pago único de los cursos?',
    answer:
      'Al comprar un curso con pago único, tienes acceso de por vida al contenido. No hay suscripción ni renovaciones automáticas.',
  },
  {
    question: '¿Puedo probar antes de pagar?',
    answer:
      'Sí, el Plan Gratuito incluye la autoevaluación completa y acceso a recursos introductorios. Así puedes conocer la plataforma antes de suscribirte.',
  },
  {
    question: '¿Qué es Productastic Review y cómo funciona?',
    answer:
      'Es un pago único de ARS $100.000 en el que NicoProducto revisa tu research, hipótesis y decisiones de producto. Después de pagar, le mandás los materiales por mail (link a tu producto, research, hipótesis, decisión a validar) y en 72 hs recibís un informe detallado con recomendaciones accionables. No es una auditoría técnica ni reemplaza un discovery completo.',
  },
  {
    question: '¿En qué consiste ProductPrepa for B2B?',
    answer:
      'Es un programa de capacitación a medida para equipos de Producto en empresas. Después de reservar el cupo, NicoProducto coordina un kickoff con el líder del área para entender al equipo y los objetivos, arma el plan a medida y arranca con sesiones grupales en vivo. Incluye acceso de todo el equipo a los cursos de ProductPrepa y reportes de avance. Si querés agendar una llamada antes de contratar, escribinos a nicoproducto@hey.com.',
  },
];

// --------------------------------------------------------------- precios

export interface PlanPricing {
  amount: number;
  formatted: string;
  currency: string;
}

export type PricingKey =
  | 'premium'
  | 'repremium'
  | 'curso_estrategia'
  | 'cursos_all'
  | 'productprepa_business';

/**
 * Precios de respaldo, en centavos de ARS.
 *
 * Los usa el hook cuando la API falla y también el build cuando no puede
 * consultar pricing-config. Vive acá, y no en usePricing, para que el
 * prerender pueda importarlos sin arrastrar el cliente de Supabase.
 *
 * Si cambiás precios en Lemon Squeezy, actualizá esto en el mismo commit: es
 * lo que se publica cuando la pasarela no responde.
 */
export const FALLBACK_PRICES: Record<PricingKey, PlanPricing> = {
  premium: { amount: 15000000, formatted: '$ 150.000', currency: 'ARS' },
  repremium: { amount: 28000000, formatted: '$ 280.000', currency: 'ARS' },
  curso_estrategia: { amount: 4900000, formatted: '$ 49.000', currency: 'ARS' },
  cursos_all: { amount: 7500000, formatted: '$ 75.000', currency: 'ARS' },
  productprepa_business: { amount: 0, formatted: '$ 0', currency: 'ARS' },
};

/** Claves de precio de los planes de suscripción (los únicos con Offer). */
export type SubscriptionPriceKey = 'premium' | 'repremium';

/**
 * JSON-LD de /planes, con los precios que se estén usando.
 *
 * Lo emiten dos caminos que tienen que dar lo mismo: la página en runtime y el
 * HTML que el build escribe para los crawlers. Si cada lado armara su propio
 * schema, el que ve Googlebot y el que ve un asistente terminarían divergiendo.
 */
export function planesJsonLd(prices: Record<SubscriptionPriceKey, PlanPricing>) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Planes y Precios | ProductPrepa',
      description:
        'Elige el plan que mejor se adapte a tu momento. Desde autoevaluación gratuita hasta mentoría personalizada.',
      offers: SUBSCRIPTION_PLANS.filter((plan) => plan.priceKey).map((plan) => ({
        '@type': 'Offer',
        name: plan.name,
        price: prices[plan.priceKey!].amount / 100,
        priceCurrency: 'ARS',
        availability: 'https://schema.org/InStock',
        itemOffered: {
          '@type': 'Service',
          name: `Mentoría ${plan.name.replace('Plan ', '')} ProductPrepa`,
          description: plan.offerDescription,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: PLANES_FAQS.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://productprepa.com' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Planes y Precios',
          item: 'https://productprepa.com/planes',
        },
      ],
    },
  ];
}
