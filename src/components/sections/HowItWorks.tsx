const steps = [
  {
    number: "01",
    title: "Evaluáte",
    detail: "5 min",
    description:
      "Respondé preguntas sobre tus habilidades en 11 competencias de Producto.",
  },
  {
    number: "02",
    title: "Descubrí",
    description:
      "Identificá tus fortalezas y las áreas donde más impacto tendrá tu desarrollo.",
  },
  {
    number: "03",
    title: "Crecé",
    description:
      "Accedé a recursos curados y un roadmap específico para tu perfil.",
  },
];

export function HowItWorks() {
  return (
    <section className="container py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-12 sm:space-y-16">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-5 sm:gap-8 items-start">
            <span className="text-5xl sm:text-7xl font-extrabold tracking-tighter text-primary/15 leading-none select-none shrink-0">
              {step.number}
            </span>
            <div className="pt-1 sm:pt-3">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
                {step.title}
                {step.detail && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    — {step.detail}
                  </span>
                )}
              </h3>
              <p className="text-muted-foreground mt-1 leading-relaxed max-w-lg">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
