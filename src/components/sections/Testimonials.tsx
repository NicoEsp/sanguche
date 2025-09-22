import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "María González",
    role: "Senior Product Manager",
    company: "TechCorp",
    content: "ProductPrepa me ayudó a identificar las brechas exactas en mi perfil. En 6 meses logré mi promoción a Senior PM.",
    rating: 5
  },
  {
    name: "Carlos Rivera",
    role: "Product Owner",
    company: "StartupXYZ",
    content: "Las recomendaciones personalizadas fueron clave para estructurar mi plan de desarrollo profesional.",
    rating: 5
  },
  {
    name: "Ana Martínez",
    role: "Associate Product Manager",
    company: "InnovateLab",
    content: "Me encanta poder hacer seguimiento de mi progreso. Es muy motivador ver cómo voy creciendo.",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section className="container py-12 sm:py-16 px-4 sm:px-6">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Lo que dicen nuestros usuarios</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Descubre cómo ProductPrepa ha ayudado a profesionales como tú a impulsar sus carreras
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="relative">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Quote className="h-5 w-5 text-primary mr-2" />
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 italic">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {testimonial.company}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}