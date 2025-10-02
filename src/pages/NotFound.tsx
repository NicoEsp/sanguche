import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";

const NotFound = () => {
  const location = useLocation();


  return (
    <>
      <Seo title="Página no encontrada — ProductPrepa" description="La página que buscas no existe." canonical={location.pathname} />
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 — Página no encontrada</h1>
          <p className="text-lg text-muted-foreground mb-6">La ruta solicitada no existe o se ha movido.</p>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default NotFound;
