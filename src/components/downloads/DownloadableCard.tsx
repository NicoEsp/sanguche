import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Eye, FileText, FileCheck, BookOpen, Loader2, Lock, Crown } from 'lucide-react';
import { DownloadableResource, DownloadableType } from '@/types/downloads';
import { getDownloadUrl } from '@/hooks/useDownloadableResources';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { isPremiumPlan } from '@/constants/plans';

const typeIcons: Record<DownloadableType, typeof FileText> = {
  pdf: FileText,
  template: FileCheck,
  checklist: FileCheck,
  guide: BookOpen,
};

const typeLabels: Record<DownloadableType, string> = {
  pdf: 'PDF',
  template: 'Template',
  checklist: 'Checklist',
  guide: 'Guía',
};

type AccessState = 'accessible' | 'requires_login' | 'requires_subscription';

interface DownloadableCardProps {
  resource: DownloadableResource;
}

export function DownloadableCard({ resource }: DownloadableCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  
  const Icon = typeIcons[resource.type] || FileText;

  const accessState: AccessState = useMemo(() => {
    // Public resources are always accessible
    if (resource.access_level === 'public') return 'accessible';
    
    // Authenticated resources require login
    if (resource.access_level === 'authenticated') {
      return isAuthenticated ? 'accessible' : 'requires_login';
    }
    
    // Premium resources require login + premium subscription
    if (resource.access_level === 'premium') {
      if (!isAuthenticated) return 'requires_login';
      if (!isPremiumPlan(subscription?.plan)) return 'requires_subscription';
      return 'accessible';
    }
    
    return 'accessible';
  }, [resource.access_level, isAuthenticated, subscription?.plan]);

  const isLocked = accessState !== 'accessible';

  const handlePreview = async () => {
    if (isLocked) return;
    
    setIsLoading(true);
    const url = await getDownloadUrl(resource);
    if (url) {
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    }
    setIsLoading(false);
  };

  const handleDownload = async () => {
    if (isLocked) return;
    
    setIsLoading(true);
    const url = await getDownloadUrl(resource);
    if (url) {
      window.open(url, '_blank');
    }
    setIsLoading(false);
  };

  return (
    <>
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[resource.type]}
                </Badge>
                {resource.is_featured && (
                  <Badge className="text-xs bg-green-500/90">Destacado</Badge>
                )}
                {resource.access_level === 'premium' && (
                  <Badge className="text-xs bg-amber-500/20 text-amber-600 border-amber-500/30">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl">{resource.title}</CardTitle>
              {resource.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {resource.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handlePreview} disabled={isLoading || isLocked}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
              Ver PDF
            </Button>
            <Button onClick={handleDownload} disabled={isLoading || isLocked}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Descargar
            </Button>
          </div>
        </CardContent>

        {/* Locked overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-center p-6 max-w-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              {accessState === 'requires_login' ? (
                <>
                  <p className="font-medium mb-2">Inicia sesión para acceder</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Este recurso está disponible para usuarios registrados
                  </p>
                  <Button 
                    onClick={() => navigate('/auth', { state: { from: { pathname: '/preguntas' } } })}
                  >
                    Iniciar sesión
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-medium mb-2">Contenido exclusivo Premium</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Accede a este recurso con tu suscripción Premium o RePremium
                  </p>
                  <Button asChild>
                    <Link to="/planes">Ver planes</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{resource.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewUrl && (
              <iframe
                src={`${previewUrl}#view=FitH`}
                className="w-full h-[70vh] border-0"
                title={`Vista previa de ${resource.title}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
