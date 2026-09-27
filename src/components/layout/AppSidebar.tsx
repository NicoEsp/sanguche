import { Link, useLocation } from "react-router-dom";
import {
  User,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Fragment, useCallback, useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { preloadRoute } from "@/routes";
import { assessmentDataQuery } from "@/hooks/useAssessmentData";
import { userProgressObjectivesQuery } from "@/hooks/useUserProgressObjectives";
import { navItems, extraItems } from "@/constants/navigation";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// localStorage keys for badge state persistence
const STORAGE_KEYS = {
  NEW_BADGES_HIDDEN: 'sidebar_new_badges_hidden',
  BADGES_COLLAPSED: 'sidebar_badges_collapsed',
} as const;

// Con el storage bloqueado (modo privado de algunos navegadores, cookies de
// terceros) localStorage tira una excepción y tiraba abajo el sidebar.
const readFlag = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeFlag = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sin storage, el badge vuelve a aparecer en la próxima visita.
  }
};

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, signOut, isLoading, isSigningOut } = useAuth();
  const shouldLoadProfile = isAuthenticated && !isLoading;
  const { profile } = useUserProfile({ skip: !shouldLoadProfile });
  const queryClient = useQueryClient();

  // Badge visibility states - initialized from localStorage
  const [showNewBadges, setShowNewBadges] = useState(() => readFlag(STORAGE_KEYS.NEW_BADGES_HIDDEN) !== 'true');
  const [collapsedBadges, setCollapsedBadges] = useState(() => readFlag(STORAGE_KEYS.BADGES_COLLAPSED) === 'true');

  // Hide "Nuevo" badges after 40 seconds (only if not already hidden)
  useEffect(() => {
    if (!showNewBadges) return;
    
    const timer = setTimeout(() => {
      setShowNewBadges(false);
      writeFlag(STORAGE_KEYS.NEW_BADGES_HIDDEN, 'true');
    }, 40000);
    return () => clearTimeout(timer);
  }, [showNewBadges]);

  // Collapse Premium/RePremium badges after 60 seconds (only if not already collapsed)
  useEffect(() => {
    if (collapsedBadges) return;
    
    const timer = setTimeout(() => {
      setCollapsedBadges(true);
      writeFlag(STORAGE_KEYS.BADGES_COLLAPSED, 'true');
    }, 60000);
    return () => clearTimeout(timer);
  }, [collapsedBadges]);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Al pasar el mouse: el chunk de la página y sus datos, con las mismas
  // queries que usan las páginas (prefetchQuery no pide nada si están frescas).
  const prefetchRoute = useCallback((href: string) => {
    void preloadRoute(href);
    if (!user?.id) return;
    if (href === '/autoevaluacion' || href === '/mejoras') {
      void queryClient.prefetchQuery(assessmentDataQuery(user.id));
    } else if (href === '/progreso' && profile?.id) {
      void queryClient.prefetchQuery(userProgressObjectivesQuery(profile.id));
    }
  }, [user?.id, profile?.id, queryClient]);

  // Función y no componente: un componente declarado acá adentro es un tipo
  // nuevo en cada render y React remontaba todos los links (por ejemplo, cuando
  // se ocultan los badges).
  const renderNavItem = (item: typeof navItems[0]) => {
    const active = isActive(item.href);
    const hasRepremium = 'repremium' in item && item.repremium;
    
    const content = (
      <Link
        to={item.href}
        onMouseEnter={() => prefetchRoute(item.href)}
        onFocus={() => prefetchRoute(item.href)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-muted/50",
          active && "bg-primary/10 text-primary font-medium",
          !active && "text-muted-foreground hover:text-foreground"
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.premium && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] py-0 transition-all duration-300",
                  collapsedBadges ? "px-1" : "px-1.5"
                )}
              >
                {collapsedBadges ? "P" : "Premium"}
              </Badge>
            )}
            {hasRepremium && (
              <Badge 
                className={cn(
                  "text-[10px] py-0 bg-amber-500/90 text-white border-0 transition-all duration-300",
                  collapsedBadges ? "px-1" : "px-1.5"
                )}
              >
                {collapsedBadges ? "RP" : "RePremium"}
              </Badge>
            )}
            {'isNew' in item && item.isNew && showNewBadges && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-500/90 text-white border-0 transition-opacity duration-300">Nuevo</Badge>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.label}
            {item.premium && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] py-0 transition-all duration-300",
                  collapsedBadges ? "px-1" : "px-1.5"
                )}
              >
                {collapsedBadges ? "P" : "Premium"}
              </Badge>
            )}
            {hasRepremium && (
              <Badge 
                className={cn(
                  "text-[10px] py-0 bg-amber-500/90 text-white border-0 transition-all duration-300",
                  collapsedBadges ? "px-1" : "px-1.5"
                )}
              >
                {collapsedBadges ? "RP" : "RePremium"}
              </Badge>
            )}
            {'isNew' in item && item.isNew && showNewBadges && (
              <Badge className="text-[10px] px-1.5 py-0 bg-green-500/90 text-white border-0">Nuevo</Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            "flex h-14 items-center border-b px-4",
            collapsed ? "justify-center" : "justify-between"
          )}>
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/assets/sanguche-96.png"
                width={96}
                height={96}
                alt="ProductPrepa Logo"
                className="h-7 w-7 object-contain"
              />
              {!collapsed && (
                <span className="font-semibold">
                  <span className="text-primary">Product</span>Prepa
                </span>
              )}
            </Link>
            
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onToggle}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Collapse button when collapsed */}
          {collapsed && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggle}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Fragment key={item.href}>{renderNavItem(item)}</Fragment>
              ))}
            </div>
            
            {/* Extras Section */}
            <div className="mt-6">
              <Separator className="mb-4" />
              {!collapsed && (
                <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Extras
                </span>
              )}
              <div className="space-y-1 mt-2">
                {extraItems.map((item) => (
                  <Fragment key={item.href}>{renderNavItem(item)}</Fragment>
                ))}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t p-3">
            {isAuthenticated ? (
              <div className="space-y-1">
                {/* Planes link */}
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to="/planes"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "bg-primary text-primary-foreground font-medium",
                        "hover:bg-primary/90",
                        isActive("/planes") && "ring-2 ring-primary/30"
                      )}
                    >
                      <CreditCard className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>Planes</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">Planes</TooltipContent>
                  )}
                </Tooltip>

                {/* Profile link */}
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to="/perfil"
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        isActive("/perfil") && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <User className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>Mi Perfil</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">Mi Perfil</TooltipContent>
                  )}
                </Tooltip>

                {/* Admin link */}
                {isAdmin && (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        to="/admin"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                          "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Shield className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>Panel Admin</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">Panel Admin</TooltipContent>
                    )}
                  </Tooltip>
                )}

                {/* Logout */}
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 px-3 py-2.5 h-auto font-normal",
                        "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                      onClick={() => signOut()}
                      disabled={isSigningOut}
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span>{isSigningOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      {isSigningOut ? 'Cerrando...' : 'Cerrar Sesión'}
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button asChild variant="default" className={cn("w-full", collapsed && "px-0")}>
                    <Link to="/auth">
                      {collapsed ? <User className="h-5 w-5" /> : "Iniciar Sesión"}
                    </Link>
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">Iniciar Sesión</TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
