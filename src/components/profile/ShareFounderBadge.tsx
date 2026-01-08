import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Star, Copy, Linkedin } from 'lucide-react';

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Badge 
          variant="founder" 
          className="text-sm px-3 py-1 cursor-pointer transition-transform hover:scale-105"
        >
          <Star className="h-3 w-3 mr-1" />
          Founder
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <h4 className="font-semibold">🎉 ¡Comparte tu badge de Founder!</h4>
          <p className="text-sm text-muted-foreground line-clamp-4">
            "Soy parte de los primeros usuarios que apoyaron a ProductPrepa desde su etapa inicial. Esta plataforma me ha ayudado a crecer..."
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleCopyText}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar texto
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={handleShareLinkedIn}
            >
              <Linkedin className="h-3 w-3 mr-1" />
              LinkedIn
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
