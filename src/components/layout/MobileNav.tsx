import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Menu,
  User,
  LogOut,
  Shield,
  Twitter,
  Linkedin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { navItems, extraItems } from "@/constants/navigation";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, signOut, isLoading, isSigningOut } = useAuth();
  const shouldLoadProfile = isAuthenticated && !isLoading;
  const { profile, loading: profileLoading } = useUserProfile({ skip: !shouldLoadProfile });
  
  const metadataName = (() => {
    const possibleName = user?.user_metadata?.name;
    return typeof possibleName === "string" ? possibleName : undefined;
  })();

  const displayName = profile?.name || metadataName || user?.email?.split('@')[0] || 'Usuario';

  const isActive = (path: string) => {
    if (path === "/starterpack") {
      return location.pathname.startsWith("/starterpack");
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur md:hidden">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/assets/sanguche.png" 
              alt="ProductPrepa Logo" 
              className="h-6 w-6 object-contain"
            />
            <span className="font-semibold">
              <span className="text-primary">Product</span>Prepa
            </span>
          </Link>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">Navegación</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col h-full py-6">
                {/* Navigation items */}
                <nav className="flex-1 space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                          active && "bg-primary/10 text-primary font-medium",
                          !active && "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                        <span className="flex-1">{item.label}</span>
                        {item.isNew && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground">Nuevo</Badge>
                        )}
                        {item.premium && !item.isNew && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Premium</Badge>
                        )}
                      </Link>
                    );
                  })}
                  
                  {/* Extras Section */}
                  <div className="mt-4 pt-4 border-t">
                    <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Extras
                    </span>
                    <div className="mt-2">
                      {extraItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                              active && "bg-primary/10 text-primary font-medium",
                              !active && "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                          >
                            <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                            <span className="flex-1">{item.label}</span>
                            {'isNew' in item && item.isNew && (
                              <Badge className="text-[10px] px-1.5 py-0 bg-green-500/90 text-white border-0">Nuevo</Badge>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </nav>

                {/* User section */}
                <div className="border-t pt-4 space-y-1">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/perfil"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                          "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          isActive("/perfil") && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <User className="h-5 w-5" />
                        <span className="truncate">
                          {profileLoading ? "Cargando..." : displayName}
                        </span>
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        >
                          <Shield className="h-5 w-5" />
                          <span>Panel Admin</span>
                        </Link>
                      )}

                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-3 py-3 h-auto font-normal text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }}
                        disabled={isSigningOut}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>{isSigningOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
                      </Button>
                    </>
                  ) : (
                    <Button asChild variant="default" className="w-full">
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        Iniciar Sesión
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Branding */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between px-3">
                    <span className="text-sm text-muted-foreground">
                      Por <span className="font-medium text-foreground">NicoProducto</span>
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
