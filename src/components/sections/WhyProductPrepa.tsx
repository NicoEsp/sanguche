const statements = [
  {
    bold: "No es un test genérico.",
    body: "Diseñado específicamente para evaluar las 11 competencias core de Product Management.",
  },
  {
    bold: "No es contenido automático.",
    body: "Recursos seleccionados y curados por profesionales experimentados en producto.",
  },
  {
    bold: "No es un camino sin guía.",
    body: "Guía estructurada diseñada por NicoProducto, Senior PM con experiencia en empresas tech, para acelerar tu desarrollo profesional.",
  },
];

export function WhyProductPrepa() {
  return (
    <section className="container py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8 sm:space-y-10">
        {statements.map((s, i) => (
          <div key={i} className="border-l-2 border-primary pl-6">
            <p className="text-lg sm:text-xl leading-relaxed">
              <strong className="text-foreground">{s.bold}</strong>{" "}
              <span className="text-muted-foreground">{s.body}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
