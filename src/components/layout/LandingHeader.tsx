import { useState } from "react";
import { Link } from "react-router-dom";
import { Twitter, Linkedin, Menu, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";

// Navegación pública: hasta ahora estas rutas no tenían ninguna entrada desde el header.
const publicNavLinks = [
  { to: "/planes", label: "Planes" },
  { to: "/cursos-info", label: "Cursos" },
  { to: "/soy-dev", label: "Soy dev" },
  { to: "/empresas", label: "Para equipos" },
  { to: "/blog", label: "Blog" },
];

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { trackEvent } = useMixpanelTracking();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur animate-fade-in">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Left: Logo + navegación pública */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/assets/sanguche.png"
              alt="ProductPrepa Logo"
              className="h-7 w-7"
            />
            <span className="font-semibold text-lg">
              <span className="text-primary">Product</span>Prepa
            </span>
          </Link>

          {/* Desde lg: abajo de ese ancho la navegación vive en el Sheet */}
          <nav className="hidden lg:flex items-center gap-5">
            {publicNavLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => trackEvent('header_nav_click', {
                  destination: link.to,
                  cta_location: 'header_desktop'
                })}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: NicoProducto — solo desde xl, en lg no entra junto a la nav */}
        <div className="hidden xl:flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Un producto por{" "}
            <span className="font-medium text-foreground">NicoProducto</span>
          </span>
          <div className="flex items-center gap-2">
            <a
              href="https://x.com/nicoproducto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NicoProducto en X (Twitter)"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/nicolas-espindola/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NicoProducto en LinkedIn"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Right: Desktop buttons (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {/* Entre lg y xl la nav ya ocupa el centro y el bloque de NicoProducto
              está oculto: sin esto, los links a X y LinkedIn no serían
              alcanzables en ese rango (el hamburguesa tampoco se muestra). */}
          <div className="hidden lg:flex xl:hidden items-center gap-2">
            <a
              href="https://x.com/nicoproducto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NicoProducto en X (Twitter)"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/nicolas-espindola/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NicoProducto en LinkedIn"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
          <Button size="sm" asChild>
            <Link to="/auth">Iniciar Sesión</Link>
          </Button>
        </div>

        {/* Mobile / tablet: Hamburger menu */}
        <div className="lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6">
                {publicNavLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => {
                      trackEvent('header_nav_click', {
                        destination: link.to,
                        cta_location: 'header_mobile'
                      });
                      setIsOpen(false);
                    }}
                    className="flex items-center p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}

                <Button asChild className="w-full mt-3">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Link>
                </Button>
              </nav>

              {/* NicoProducto info en móvil */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-col gap-2 bg-card border border-border rounded-lg p-3">
                  <span className="text-sm text-muted-foreground">
                    Un producto por{" "}
                    <span className="font-medium text-foreground">NicoProducto</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://x.com/nicoproducto"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="NicoProducto en X (Twitter)"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/nicolas-espindola/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="NicoProducto en LinkedIn"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
