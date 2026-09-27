import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { footerLinks } from "@/constants/navigation";
import { cn } from "@/lib/utils";

interface LayoutFrameProps {
  /** Navegación: LandingHeader para anónimos, sidebar o menú móvil si hay sesión. */
  nav: ReactNode;
  children: ReactNode;
  /** Header de escritorio de usuarios logueados. */
  topBar?: ReactNode;
  contentClassName?: string;
}

/**
 * El marco de todas las páginas públicas y de usuario: navegación, contenido y
 * footer. Lo usan AppLayout y el prerender del build (scripts/prerender/render.tsx),
 * así el HTML servido y el primer render de React tienen el mismo DOM y el
 * reemplazo no se nota. Tiene que seguir siendo puro: sin hooks de sesión.
 */
export function LayoutFrame({ nav, children, topBar, contentClassName }: LayoutFrameProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {nav}

      <div className={cn("flex-1 flex flex-col transition-all duration-300", contentClassName)}>
        {topBar}

        <main className="flex-1">{children}</main>

        <footer className="border-t bg-background">
          <div className="container py-8">
            {/* Presente en todas las páginas: la entrada más barata a las rutas
                públicas que no se linkean desde ningún otro lado. */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="mt-6 text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} ProductPrepa
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
