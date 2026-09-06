import { Link } from 'react-router-dom';
import {
  DOWNLOADABLE_ACCESS_LABELS,
  DOWNLOADABLE_TYPE_LABELS,
  type DownloadableAccessLevel,
  type DownloadableType,
} from '@/types/downloads';

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

/**
 * Versión estática de /descargables para el HTML servido.
 *
 * El catálogo sale de la misma consulta a Supabase que hace la página, así que
 * no hay contenido duplicado que mantener. Lo que no se prerenderiza es la
 * búsqueda, el filtro y los botones de descarga: dependen de la sesión y del
 * plan, y de todas formas no son contenido indexable.
 *
 * Sin hooks ni browser globals (ver scripts/prerender/render.tsx).
 */
export function DescargablesSeoContent({ resources }: { resources: DownloadablePublic[] }) {
  // Mismo orden que la página: destacados primero, después display_order.
  const sorted = [...resources].sort(
    (a, b) => Number(b.is_featured) - Number(a.is_featured) || a.display_order - b.display_order,
  );

  return (
    <main className="container max-w-4xl space-y-8 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Descargables</h1>
        <p className="text-muted-foreground">
          Guías, templates y checklists para Product Builders. Algunos son de descarga libre,
          otros piden una cuenta gratuita y otros vienen con los planes Premium.
        </p>
        <p className="text-sm text-muted-foreground">
          {sorted.length === 0
            ? 'Estamos preparando los primeros recursos.'
            : `${sorted.length} recursos disponibles.`}
        </p>
      </header>

      {sorted.length > 0 && (
        <ul className="space-y-4">
          {sorted.map((resource) => (
            <li key={resource.slug} className="space-y-1 rounded-lg border bg-card p-4">
              <h2 className="font-semibold">{resource.title}</h2>
              {resource.description && (
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {DOWNLOADABLE_TYPE_LABELS[resource.type] ?? resource.type} ·{' '}
                {DOWNLOADABLE_ACCESS_LABELS[resource.access_level]}
                {resource.is_featured && ' · Destacado'}
              </p>
            </li>
          ))}
        </ul>
      )}

      <footer className="space-y-2 text-sm text-muted-foreground">
        <p>
          ¿No sabés cuál te sirve?{' '}
          <Link to="/evaluacion-product-manager" className="underline">
            Hacé la evaluación gratuita
          </Link>{' '}
          y te recomendamos los más afines a tus áreas de mejora.
        </p>
        <p>
          <Link to="/planes" className="underline">
            Ver los planes
          </Link>{' '}
          para acceder a los recursos premium.
        </p>
      </footer>
    </main>
  );
}
