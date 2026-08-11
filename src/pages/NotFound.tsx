import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";

const NotFound = () => {
  const location = useLocation();
  const { trackEvent } = useMixpanelTracking();

  // Registrar la ruta rota para poder detectar links muertos desde Mixpanel.
  useEffect(() => {
    trackEvent('page_not_found', { attempted_path: location.pathname });
  }, [trackEvent, location.pathname]);

  return (
    <>
      <Seo title="Página no encontrada — ProductPrepa" description="La página que buscás no existe." canonical={location.pathname} />
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404 — Página no encontrada</h1>
          <p className="text-lg text-muted-foreground mb-6">La ruta solicitada no existe o se ha movido.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              onClick={() => trackEvent('page_not_found_cta_clicked', {
                cta_location: 'not_found',
                destination: '/'
              })}
            >
              <Link to="/">Volver al inicio</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              onClick={() => trackEvent('page_not_found_cta_clicked', {
                cta_location: 'not_found',
                destination: '/descargables'
              })}
            >
              <Link to="/descargables">Ver recursos descargables</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
