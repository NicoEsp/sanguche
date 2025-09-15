import { Link, NavLink } from "react-router-dom";
import { ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { isPremiumFeature, FEATURES } from "@/utils/features";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/autoevaluacion", label: "Autoevaluación", premium: false },
    { href: "/brechas", label: "Brechas", premium: false },
    { href: "/recomendaciones", label: "Recomendaciones", premium: isPremiumFeature(FEATURES.RECOMMENDATIONS) },
    { href: "/progreso", label: "Progreso", premium: isPremiumFeature(FEATURES.PROGRESS) },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <nav className="container h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            <span className="text-primary">Product</span>Prepa
          </Link>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-4 text-sm">
              {navItems.map((item) => (
                <NavLink 
                  key={item.href}
                  to={item.href} 
                  className={({ isActive }) => isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}
                >
                  <span className="flex items-center gap-2">
                    {item.label}
                    {item.premium && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Premium</Badge>
                    )}
                  </span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Navegación</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  {navItems.map((item) => (
                    <NavLink 
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) => 
                        `flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isActive 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`
                      }
                    >
                      <span>{item.label}</span>
                      {item.premium && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Premium</Badge>
                      )}
                    </NavLink>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
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
