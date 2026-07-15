import type { Faq } from './soyDev';

// FAQs de la landing. Cubren los 4 perfiles de la evaluación para que queden
// mapeados por SEO (FAQPage JSON-LD en la ruta '/') además de mostrarse en el
// acordeón visible de la home.
export const homeFaqs: Faq[] = [
  {
    question: '¿Qué es la evaluación de ProductPrepa?',
    answer:
      'Es una evaluación gratuita de 5 minutos que diagnostica tu situación en Producto y te devuelve un gráfico de radar con tus competencias, tus fortalezas, tus áreas de mejora y una recomendación hecha a tu medida. Cuando te registrás, elegís tu perfil entre cuatro opciones y la evaluación se adapta a vos.',
  },
  {
    question: '¿Qué perfiles de evaluación existen?',
    answer:
      'Hay cuatro. "Ya trabajo en producto" para PMs, diseñadores o desarrolladores con experiencia que quieren un diagnóstico de seniority. "Quiero dar el salto" para quienes todavía no trabajan en producto digital y buscan un mapa de afinidad para saber por dónde entrar. "Estoy construyendo un producto" para founders y product builders que quieren medir la madurez de su método. Y "Lidero un equipo de producto" para managers, heads o team leads que quieren una radiografía de la madurez de su equipo.',
  },
  {
    question: '¿Necesito experiencia previa en producto para hacer la evaluación?',
    answer:
      'No. El perfil "Quiero dar el salto" está pensado justamente para personas sin experiencia previa en producto digital. En lugar de medir seniority, arma un mapa de afinidad que muestra en qué áreas tenés más terreno ganado y sugiere un rol de entrada (Product Manager, Diseño de Producto o Desarrollo) para orientar tus primeros pasos.',
  },
  {
    question: 'Estoy construyendo mi propio producto, ¿me sirve la evaluación?',
    answer:
      'Sí. El perfil "Estoy construyendo un producto" mide cuánto método hay detrás de lo que estás creando: si trabajás a instinto o con un proceso, y en qué dominios (discovery, analítica, monetización, growth y más) te conviene aplicar la teoría que te falta. La recomendación apunta a Productastic Review, una revisión a fondo de tu producto con devolución accionable.',
  },
  {
    question: 'Lidero un equipo de producto, ¿qué me aporta?',
    answer:
      'El perfil "Lidero un equipo de producto" evalúa la madurez de tu equipo en cada dominio y te muestra dónde nivelarlo. En vez de mirar tu práctica individual, diagnostica los procesos del equipo y tu rol como habilitador. La recomendación apunta a ProductPrepa for B2B, un programa de capacitación a medida para tu equipo.',
  },
  {
    question: '¿Qué obtengo al terminar la evaluación?',
    answer:
      'Un resultado visual con un gráfico de radar de tus competencias, la lista de tus fortalezas y tus áreas de mejora priorizadas, y una recomendación concreta según tu perfil. Todo eso te queda disponible para seguir trabajándolo con recursos, cursos y mentoría.',
  },
  {
    question: '¿La evaluación tiene costo?',
    answer:
      'No, la evaluación es completamente gratuita, sin importar qué perfil elijas. Recién si querés profundizar con mentoría 1:1, cursos o un programa para tu equipo, hay planes pensados para cada etapa.',
  },
];
