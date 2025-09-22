import { Link, NavLink } from "react-router-dom";
import React, { ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut } from "lucide-react";
import { isPremiumFeature, FEATURES } from "@/utils/features";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, signOut, isLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

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
            <div className="flex items-center gap-6">
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

              {/* Sección de autenticación desktop */}
              <div className="flex items-center">
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="max-w-32 truncate">
                          {profileLoading ? "Cargando..." : `Hola ${profile?.name}!`}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled>
                        <User className="h-4 w-4 mr-2" />
                        Mi Perfil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => signOut()}
                        disabled={isLoading}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Cerrar Sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild variant="default" size="sm">
                    <Link to="/auth">Iniciar Sesión</Link>
                  </Button>
                )}
              </div>
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

                  {/* Sección de autenticación móvil */}
                  <div className="mt-6 pt-6 border-t">
                    {isAuthenticated ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                           <span className="truncate">
                             {profileLoading ? "Cargando..." : `Hola ${profile?.name}!`}
                           </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start" 
                          onClick={() => {
                            signOut();
                            setIsOpen(false);
                          }}
                          disabled={isLoading}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Cerrar Sesión
                        </Button>
                      </div>
                    ) : (
                      <Button asChild variant="default" className="w-full" onClick={() => setIsOpen(false)}>
                        <Link to="/auth">Iniciar Sesión</Link>
                      </Button>
                    )}
                  </div>
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
