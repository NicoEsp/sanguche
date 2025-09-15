import { Link, NavLink } from "react-router-dom";
import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { isPremiumFeature, FEATURES } from "@/utils/features";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <nav className="container h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            <span className="text-primary">Product</span>Prepa
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <NavLink to="/autoevaluacion" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>
              Autoevaluación
            </NavLink>
            <NavLink to="/brechas" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>
              Brechas
            </NavLink>
            <NavLink to="/recomendaciones" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>
              <span className="flex items-center gap-2">
                Recomendaciones
                {isPremiumFeature(FEATURES.RECOMMENDATIONS) && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Premium</Badge>
                )}
              </span>
            </NavLink>
            <NavLink to="/progreso" className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}>
              <span className="flex items-center gap-2">
                Progreso
                {isPremiumFeature(FEATURES.PROGRESS) && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Premium</Badge>
                )}
              </span>
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="container py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} ProductPrepa
        </div>
      </footer>
    </div>
  );
}
