import type { Faq } from './soyDev';

// FAQs de /evaluacion-product-manager. Se muestran en la página y además se
// emiten como FAQPage JSON-LD desde SEO_ROUTES, para las búsquedas del tipo
// "cuánto dura", "es gratis", "necesito experiencia".
export const evaluacionFaqs: Faq[] = [
  {
    question: '¿Cuánto tarda la evaluación de Product Manager?',
    answer:
      'Alrededor de cinco minutos. Son preguntas de opción múltiple sobre cómo trabajás hoy, no un examen de teoría: no hay nada que estudiar antes.',
  },
  {
    question: '¿La evaluación es gratis?',
    answer:
      'Sí. Hacerla y ver tu resultado es gratis. Sólo necesitás crear una cuenta para que el diagnóstico quede guardado y puedas volver a mirarlo.',
  },
  {
    question: '¿Necesito experiencia previa en Producto?',
    answer:
      'No. Uno de los cuatro perfiles, "Quiero dar el salto", está pensado justamente para quien todavía no trabaja en producto digital. En vez de medir seniority, arma un mapa de afinidad que muestra en qué áreas tenés más terreno ganado y por dónde te conviene entrar.',
  },
  {
    question: '¿Qué mide exactamente?',
    answer:
      'Once competencias de Producto: estrategia, roadmap y priorización, ejecución, discovery de usuarios, analítica, UX, gestión de stakeholders, comunicación, liderazgo, conocimiento técnico y monetización. El resultado es un radar con el puntaje de cada una, no un número suelto.',
  },
  {
    question: '¿Puedo volver a hacerla más adelante?',
    answer:
      'Sí, cuando quieras. Es la forma de ver cómo te movés con el tiempo. Tené en cuenta que el resultado anterior se reemplaza por el nuevo.',
  },
];
