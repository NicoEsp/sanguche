import { Link } from "react-router-dom";
import type { DownloadableAccessLevel, DownloadableType } from "@/types/downloads";

/**
 * Las columnas del catálogo que el build trae de Supabase. Es un subconjunto de
 * DownloadableResource a propósito: la ruta pública no necesita ni el bucket ni
 * el file_path, y pedirlos sería exponer de más en el HTML.
 */
export interface DownloadablePublic {
  slug: string;
  title: string;
  description: string | null;
  type: DownloadableType;
  access_level: DownloadableAccessLevel;
  is_featured: boolean;
  display_order: number;
}

const TYPE_LABELS: Record<DownloadableType, string> = {
  pdf: "PDF",
  template: "Plantilla",
  checklist: "Checklist",
  guide: "Guía",
  image: "Imagen"
};

const ACCESS_LABELS: Record<DownloadableAccessLevel, string> = {
  public: "Descarga libre",
  authenticated: "Requiere cuenta gratuita",
  premium: "Incluido en los planes Premium"
};

/**
 * Versión estática de /descargables para el HTML servido.
 *
 * El catálogo sale de la misma consulta a Supabase que hace la página, así que
 * no hay contenido duplicado que mantener. Lo que no se prerenderiza es la
 * búsqueda, los filtros y los botones de descarga: dependen de la sesión y del
 * plan, y de todas formas no son contenido indexable.
 *
 * Sin hooks ni browser globals (ver scripts/prerender/render.tsx).
 */
export function DescargablesSeoContent({ resources }: { resources: DownloadablePublic[] }) {
  const featured = resources.filter((r) => r.is_featured);
  const rest = resources.filter((r) => !r.is_featured);

  const list = (items: DownloadablePublic[]) => (
    <ul className="space-y-4">
      {items.map((resource) => (
        <li key={resource.slug} className="rounded-lg border bg-card p-4 space-y-1">
          <h3 className="font-semibold">{resource.title}</h3>
          {resource.description && (
            <p className="text-sm text-muted-foreground">{resource.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {TYPE_LABELS[resource.type] ?? resource.type} · {ACCESS_LABELS[resource.access_level]}
          </p>
        </li>
      ))}
    </ul>
  );

  return (
    <main className="container max-w-4xl py-12 space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Descargables</h1>
        <p className="text-muted-foreground">
          Recursos exclusivos para Product Builders. Descargá documentos, templates y guías.
        </p>
        <p className="text-sm text-muted-foreground">
          {resources.length === 0
            ? "Estamos preparando los primeros recursos."
            : `${resources.length} recursos disponibles. Algunos son de descarga libre, otros piden una cuenta gratuita y otros están incluidos en los planes Premium.`}
        </p>
      </header>

      {featured.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Destacados</h2>
          {list(featured)}
        </section>
      )}

      {rest.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">
            {featured.length > 0 ? "Todos los recursos" : "Recursos disponibles"}
          </h2>
          {list(rest)}
        </section>
      )}

      <footer className="space-y-2 text-sm text-muted-foreground">
        <p>
          ¿No sabés cuál te sirve?{" "}
          <Link to="/evaluacion-product-manager" className="underline">
            Hacé la evaluación gratuita
          </Link>{" "}
          y te recomendamos los más afines a tus áreas de mejora.
        </p>
        <p>
          <Link to="/planes" className="underline">
            Ver los planes
          </Link>{" "}
          para acceder a los recursos premium.
        </p>
      </footer>
    </main>
  );
}
