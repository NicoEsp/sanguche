import assessmentImg from '/screenshots/assessment.jpg';
import careerPathImg from '/screenshots/career-path.jpg';
import mentoriaImg from '/screenshots/mentoria.jpg';

const previews = [
  {
    title: 'Autoevaluación de habilidades',
    description: 'Identificá tus fortalezas y áreas de mejora en 5 minutos.',
    image: assessmentImg,
  },
  {
    title: 'Career Path personalizado',
    description: 'Objetivos concretos adaptados a tu perfil y nivel.',
    image: careerPathImg,
  },
  {
    title: 'Mentoría 1:1 dedicada',
    description: 'Recursos curados, ejercicios y sesiones con tu mentor.',
    image: mentoriaImg,
  },
];

export function PlatformPreview() {
  return (
    <section className="container py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-3">
          Una plataforma pensada para PMs
        </h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
          Todo lo que necesitás para crecer como Product Builder, en un solo lugar.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {previews.map((preview) => (
            <div key={preview.title} className="group">
              <div className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow group-hover:shadow-md">
                <img
                  src={preview.image}
                  alt={preview.title}
                  loading="lazy"
                  width={1280}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
              <h3 className="font-semibold mt-3 mb-1">{preview.title}</h3>
              <p className="text-sm text-muted-foreground">{preview.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
