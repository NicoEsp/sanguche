import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface StarterPackHeroProps {
  chip?: string;
  title: string;
  subtitle: string;
  secondaryCta?: {
    label: string;
    href: string;
  };
}

export function StarterPackHero({ chip, title, subtitle, secondaryCta }: StarterPackHeroProps) {
  return (
    <section className="py-8 md:py-12 text-center">
      <div className="container max-w-4xl mx-auto px-4">
        {chip && (
          <Badge variant="secondary" className="mb-4 text-sm font-medium">
            {chip}
          </Badge>
        )}
        
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          {title}
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {subtitle}
        </p>
        
        {secondaryCta && (
          <Button variant="outline" asChild className="mt-6">
            <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
