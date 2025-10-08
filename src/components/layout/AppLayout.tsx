import { Link } from "react-router-dom";
import { ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Shield, CheckSquare, Target, BookOpen, TrendingUp, Twitter, Linkedin } from "lucide-react";
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
  const { user, isAuthenticated, isAdmin, signOut, isLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const navItems = [
    { href: "/autoevaluacion", label: "Autoevaluación", premium: false },
    { href: "/mejoras", label: "Áreas de mejora", premium: false },
    { href: "/mentoria", label: "Mentoría", premium: isPremiumFeature(FEATURES.RECOMMENDATIONS) },
    { href: "/progreso", label: "Progreso", premium: isPremiumFeature(FEATURES.PROGRESS) },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <nav className={`container h-14 flex items-center gap-3 ${isMobile ? 'justify-end' : 'justify-start'}`}>
          <Link to="/" className="font-semibold flex items-center gap-2">
            <img 
              src="/assets/sanguche.png" 
              alt="ProductPrepa Logo" 
              className="h-6 w-6 object-contain"
            />
            <span><span className="text-primary">Product</span>Prepa</span>
          </Link>
          
          {/* Branding card */}
          {!isMobile && (
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2 shadow-sm ml-12">
              <span className="text-sm text-muted-foreground">
                <span className="hidden sm:inline">Un producto por </span>
                <span className="font-medium text-foreground">NicoProducto</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="https://x.com/nicoproducto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/nicolas-espindola/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center ml-auto">
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
                  <DropdownMenuContent align="end" className="w-56">
                    {navItems.map((item, index) => {
                      const icons = [CheckSquare, Target, BookOpen, TrendingUp];
                      const Icon = icons[index];
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link to={item.href} className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <Icon className="h-4 w-4 mr-2" />
                              {item.label}
                            </div>
                            {item.premium && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Premium</Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <User className="h-4 w-4 mr-2" />
                      Mi Perfil
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.location.href = '/admin'}>
                          <Shield className="h-4 w-4 mr-2" />
                          Panel de Admin
                        </DropdownMenuItem>
                      </>
                    )}
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
                        
                        {/* Navigation items in mobile */}
                        <div className="space-y-1">
                          {navItems.map((item, index) => {
                            const icons = [CheckSquare, Target, BookOpen, TrendingUp];
                            const Icon = icons[index];
                            return (
                              <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between p-3 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              >
                                <div className="flex items-center">
                                  <Icon className="h-4 w-4 mr-2" />
                                  {item.label}
                                </div>
                                {item.premium && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Premium</Badge>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        <div className="pt-3 border-t space-y-1">
                          <Button variant="ghost" disabled className="w-full justify-start">
                            <User className="h-4 w-4 mr-2" />
                            Mi Perfil
                          </Button>
                          
                          {isAdmin && (
                            <Button 
                              variant="ghost" 
                              onClick={() => {
                                window.location.href = '/admin';
                                setIsOpen(false);
                              }}
                              className="w-full justify-start"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Panel de Admin
                            </Button>
                          )}
                          
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
