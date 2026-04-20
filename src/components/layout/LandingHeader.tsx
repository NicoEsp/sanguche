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

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur animate-fade-in">
      <div className="container flex h-14 items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/assets/sanguche.png" 
            alt="ProductPrepa Logo" 
            className="h-7 w-7" 
          />
          <span className="font-semibold text-lg">
            <span className="text-primary">Product</span>Prepa
          </span>
        </Link>

        {/* Center: NicoProducto (desktop only) */}
        <div className="hidden md:flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
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

        {/* Right: Desktop buttons (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-3">
          <Button size="sm" asChild>
            <Link to="/auth">Iniciar Sesión</Link>
          </Button>
        </div>

        {/* Mobile: Hamburger menu */}
        <div className="sm:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                <Link 
                  to="/auth" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <LogIn className="h-5 w-5 text-primary" />
                  <span className="font-medium">Iniciar Sesión</span>
                </Link>
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
