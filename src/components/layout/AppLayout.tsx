import { ReactNode, useState } from "react";
import { Twitter, Linkedin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { LandingHeader } from "./LandingHeader";
import { FeedbackFooterCta } from "@/components/feedback/FeedbackFooterCta";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const shouldLoadProfile = isAuthenticated && !isLoading;
  const { profile } = useUserProfile({ skip: !shouldLoadProfile });
  
  const metadataName = (() => {
    const possibleName = user?.user_metadata?.name;
    return typeof possibleName === "string" ? possibleName : undefined;
  })();

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation based on authentication */}
      {isAuthenticated ? (
        <>
          {/* Mobile Navigation */}
          {isMobile && <MobileNav />}
          
          {/* Desktop Sidebar */}
          {!isMobile && (
            <AppSidebar 
              collapsed={sidebarCollapsed} 
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />
          )}
        </>
      ) : (
        /* Public Landing Header */
        <LandingHeader />
      )}

      {/* Main content wrapper */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        isAuthenticated && !isMobile && (sidebarCollapsed ? "ml-16" : "ml-64")
      )}>
        {/* Desktop Header for authenticated users - Simple branding only */}
        {isAuthenticated && !isMobile && (
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
            <div className="container flex h-14 items-center">
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
            </div>
          </header>
        )}

        <main className="flex-1">{children}</main>

        <footer className="border-t bg-background">
          <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © {new Date().getFullYear()} ProductPrepa
            </p>
            
            <FeedbackFooterCta
              isAuthenticated={isAuthenticated}
              profileName={profile?.name}
              metadataName={metadataName}
              userEmail={user?.email}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
