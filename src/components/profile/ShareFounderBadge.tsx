import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Star, Copy, Linkedin, Share2 } from 'lucide-react';

const LINKEDIN_MESSAGE = `🎉 ¡Obtuve la badge de Founder en ProductPrepa!

Soy parte de los primeros usuarios que apoyaron a ProductPrepa desde su etapa inicial. Esta plataforma me ha ayudado a crecer y mejorar mis habilidades y conocimientos como Product Manager.

Si quieres potenciar tu carrera en producto, te invito a conocerla 👇

https://productprepa.com

#ProductManagement #CareerGrowth #ProductPrepa`;

export function ShareFounderBadge() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(LINKEDIN_MESSAGE);
    toast({
      title: "✓ Texto copiado",
      description: "Pégalo donde quieras compartirlo",
    });
  };

  const handleShareLinkedIn = async () => {
    await navigator.clipboard.writeText(LINKEDIN_MESSAGE);
    toast({
      title: "✓ Texto copiado",
      description: "Pega el texto en tu publicación de LinkedIn",
    });
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://productprepa.com')}`,
      '_blank',
      'noopener,noreferrer'
    );
    setIsOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Badge 
          variant="founder" 
          className="text-sm px-3 py-1"
        >
          <Star className="h-3 w-3 mr-1" />
          Founder
        </Badge>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Compartir en redes sociales</p>
            </TooltipContent>
          </Tooltip>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>🎉 ¡Comparte tu badge de Founder!</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              "Soy parte de los primeros usuarios que apoyaron a ProductPrepa desde su etapa inicial. Esta plataforma me ha ayudado a crecer y mejorar mis habilidades y conocimientos como Product Manager..."
            </p>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCopyText}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar texto
              </Button>
              <Button 
                className="flex-1"
                onClick={handleShareLinkedIn}
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
