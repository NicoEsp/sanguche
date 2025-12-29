import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarterPackResource, AccessState } from '@/types/starterpack';
import { 
  FileText, 
  Video, 
  FileCheck, 
  Download, 
  Lock, 
  LogIn,
  Clock,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ResourceCardProps {
  resource: StarterPackResource;
  accessState: AccessState;
  onDownload?: () => void;
}

const typeIcons = {
  article: FileText,
  pdf: FileText,
  video: Video,
  template: FileCheck,
  checklist: FileCheck,
};

const typeLabels = {
  article: 'Artículo',
  pdf: 'PDF',
  video: 'Video',
  template: 'Template',
  checklist: 'Checklist',
};

const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const levelColors = {
  beginner: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  intermediate: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  advanced: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
};

export function ResourceCard({ resource, accessState, onDownload }: ResourceCardProps) {
  const Icon = typeIcons[resource.type] || FileText;
  const shouldShowTooltip = resource.description && resource.description.length > 80;
  
  return (
    <Card className={cn(
      "group transition-all hover:shadow-md",
      accessState !== 'accessible' && "opacity-75"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-xs">
            <Icon className="w-3 h-3 mr-1" />
            {typeLabels[resource.type]}
          </Badge>
          
          {resource.access_type === 'premium' && (
            <Badge variant="outline" className="text-amber-600 border-amber-500/30">
              <Lock className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-base leading-tight mt-2">
          {resource.title}
        </CardTitle>
        
        {resource.description && (
          shouldShowTooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                    {resource.description}
                  </p>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{resource.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {resource.description}
            </p>
          )
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          {resource.duration_estimate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {resource.duration_estimate}
            </span>
          )}
          <Badge variant="outline" className={cn("text-xs", levelColors[resource.level])}>
            <BarChart3 className="w-3 h-3 mr-1" />
            {levelLabels[resource.level]}
          </Badge>
        </div>
        
        {/* Action button based on access state */}
        {accessState === 'accessible' && (
          <Button 
            size="sm" 
            className="w-full"
            onClick={onDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
        )}
        
        {accessState === 'requires_login' && (
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-full"
            asChild
          >
            <Link to="/auth">
              <LogIn className="w-4 h-4 mr-2" />
              Crear cuenta gratis
            </Link>
          </Button>
        )}
        
        {accessState === 'requires_premium' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
            asChild
          >
            <Link to="/planes">
              <Lock className="w-4 h-4 mr-2" />
              Desbloquear con Premium
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
