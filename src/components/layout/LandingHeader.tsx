import { Link } from "react-router-dom";
import { Twitter, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
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

        {/* Right: Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/starterpack">Starter Pack</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth">Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
