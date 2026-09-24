import { ReactNode, Suspense, lazy, useState } from "react";
import { Twitter, Linkedin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { LandingHeader } from "./LandingHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutFrame } from "./LayoutFrame";
import { cn } from "@/lib/utils";

// La navegación de usuarios logueados (sidebar, menú móvil, sus tooltips y
// floating-ui) no viaja en el bundle inicial: la mayoría de las visitas son
// anónimas y solo usan LandingHeader. Se carga en paralelo con la página.
const AppSidebar = lazy(() => import("./AppSidebar").then((m) => ({ default: m.AppSidebar })));
const MobileNav = lazy(() => import("./MobileNav").then((m) => ({ default: m.MobileNav })));

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  // Show skeleton during auth loading to prevent layout flashing
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <div className="flex-1 flex">
          {!isMobile && <Skeleton className="w-64 h-screen shrink-0" />}
          <main className="flex-1 p-8 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full max-w-2xl" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <LayoutFrame
      nav={
        isAuthenticated ? (
          <>
            {/* Mobile Navigation */}
            {isMobile && (
              <Suspense fallback={<header className="sticky top-0 z-40 h-14 border-b bg-background/95 md:hidden" />}>
                <MobileNav />
              </Suspense>
            )}

            {/* Desktop Sidebar. El fallback ocupa el mismo ancho para que el contenido no salte. */}
            {!isMobile && (
              <Suspense
                fallback={
                  <aside className={cn("fixed left-0 top-0 z-40 h-screen border-r bg-card", sidebarCollapsed ? "w-16" : "w-64")} />
                }
              >
                <AppSidebar
                  collapsed={sidebarCollapsed}
                  onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
              </Suspense>
            )}
          </>
        ) : (
          /* Public Landing Header */
          <LandingHeader />
        )
      }
      contentClassName={cn(isAuthenticated && !isMobile && (sidebarCollapsed ? "ml-16" : "ml-64"))}
      topBar={
        /* Desktop Header for authenticated users - Simple branding only */
        isAuthenticated && !isMobile && (
          <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur">
            <div className="container flex h-full items-center">
              <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
                <span className="text-sm text-muted-foreground">
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
            </div>
          </header>
        )
      }
    >
      {children}
    </LayoutFrame>
  );
}
