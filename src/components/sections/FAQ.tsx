import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Es realmente gratis la autoevaluación?",
    answer: "Sí, completamente. Puedes hacer la autoevaluación completa, ver tus brechas de habilidades y conocer tu nivel de seniority sin costo alguno. Solo necesitas registrarte."
  },
  {
    question: "¿Qué incluye exactamente el plan Premium?",
    answer: "Premium incluye recomendaciones personalizadas de recursos para cerrar tus brechas, un roadmap de carrera específico, panel de seguimiento de progreso y acceso a contenido curado por expertos de la industria."
  },
  {
    question: "¿Mis datos están seguros?",
    answer: "Absolutamente. Toda tu información está cifrada y protegida. Solo tú decides qué compartir y con quién. Puedes eliminar tu cuenta y datos en cualquier momento."
  },
  {
    question: "¿Puedo cancelar mi suscripción Premium cuando quiera?",
    answer: "Sí, puedes cancelar en cualquier momento desde tu panel de usuario. No hay compromisos a largo plazo ni penalizaciones por cancelación."
  },
  {
    question: "¿Cómo funciona la integración con LinkedIn?",
    answer: "Puedes compartir tu badge de nivel de seniority en LinkedIn de forma opcional. Es una excelente manera de mostrar tu compromiso con el desarrollo profesional continuo."
  },
  {
    question: "¿Qué tan precisa es la evaluación?",
    answer: "Nuestra evaluación está basada en frameworks validados por la industria y ha sido revisada por Senior PMs de empresas tech líderes. Se actualiza regularmente para reflejar las tendencias actuales."
  }
];

export function FAQ() {
  return (
    <section className="container py-12 sm:py-16 px-4 sm:px-6">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Preguntas Frecuentes</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Resolvemos las dudas más comunes sobre ProductPrepa
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}