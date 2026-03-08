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
import { useCallback, useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { navItems, extraItems } from "@/constants/navigation";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const { user, isAuthenticated, isAdmin, signOut, isLoading, isSigningOut } = useAuth();
  const shouldLoadProfile = isAuthenticated && !isLoading;
  const { profile, loading: profileLoading } = useUserProfile({ skip: !shouldLoadProfile });
  const queryClient = useQueryClient();
  
  // localStorage keys for badge state persistence
  const STORAGE_KEYS = {
    NEW_BADGES_HIDDEN: 'sidebar_new_badges_hidden',
    BADGES_COLLAPSED: 'sidebar_badges_collapsed'
  };

  // Badge visibility states - initialized from localStorage
  const [showNewBadges, setShowNewBadges] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.NEW_BADGES_HIDDEN);
    return stored !== 'true';
  });
  const [collapsedBadges, setCollapsedBadges] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.BADGES_COLLAPSED);
    return stored === 'true';
  });

  // Hide "Nuevo" badges after 40 seconds (only if not already hidden)
  useEffect(() => {
    if (!showNewBadges) return;
    
    const timer = setTimeout(() => {
      setShowNewBadges(false);
      localStorage.setItem(STORAGE_KEYS.NEW_BADGES_HIDDEN, 'true');
    }, 40000);
    return () => clearTimeout(timer);
  }, [showNewBadges]);

  // Collapse Premium/RePremium badges after 60 seconds (only if not already collapsed)
  useEffect(() => {
    if (collapsedBadges) return;
    
    const timer = setTimeout(() => {
      setCollapsedBadges(true);
      localStorage.setItem(STORAGE_KEYS.BADGES_COLLAPSED, 'true');
    }, 60000);
    return () => clearTimeout(timer);
  }, [collapsedBadges]);
  
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

  // Prefetch de datos según la ruta para carga instantánea
  const prefetchRouteData = useCallback((route: string) => {
    if (!user?.id) return;
    
    const userId = user.id;
    const profileId = profile?.id;
    
    switch (route) {
      case '/autoevaluacion':
      case '/mejoras':
      case '/mentoria':
        // Prefetch assessment data
        queryClient.prefetchQuery({
          queryKey: ['assessment', userId],
          queryFn: async () => {
            const { data } = await supabase
              .from('assessments')
              .select('*')
              .eq('user_id', userId)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            return data;
          },
          staleTime: 5 * 60 * 1000,
        });
        break;
        
      case '/progreso':
        // Prefetch progress objectives
        if (profileId) {
          queryClient.prefetchQuery({
            queryKey: ['user-progress-objectives', profileId],
            queryFn: async () => {
              const { data } = await supabase
                .from('user_progress_objectives')
                .select('*')
                .eq('user_id', profileId)
                .order('created_at', { ascending: false });
              return data || [];
            },
            staleTime: 2 * 60 * 1000,
          });
          
          queryClient.prefetchQuery({
            queryKey: ['recommended-objectives', profileId],
            queryFn: async () => {
              const { data } = await supabase
                .from('dismissed_recommended_objectives')
                .select('objective_key')
                .eq('user_id', profileId);
              return data?.map(d => d.objective_key) || [];
            },
            staleTime: 2 * 60 * 1000,
          });
        }
        break;
    }
  }, [user?.id, profile?.id, queryClient]);

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const active = isActive(item.href);
    const hasRepremium = 'repremium' in item && item.repremium;
    
    const content = (
      <Link
        to={item.href}
        onMouseEnter={() => prefetchRouteData(item.href)}
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
                src="/assets/sanguche.png" 
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
                <NavItem key={item.href} item={item} />
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
                  <NavItem key={item.href} item={item} />
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
