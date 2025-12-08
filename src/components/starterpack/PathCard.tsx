import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Rocket, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PathCardProps {
  variant: 'build' | 'lead';
  title: string;
  description: string;
  bullets: string[];
  ctaText: string;
  ctaHref: string;
}

export function PathCard({ variant, title, description, bullets, ctaText, ctaHref }: PathCardProps) {
  const Icon = variant === 'build' ? Rocket : Users;
  
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-lg",
      variant === 'build' 
        ? "border-primary/20 hover:border-primary/40" 
        : "border-secondary/20 hover:border-secondary/40"
    )}>
      <CardHeader className="pb-4">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
          variant === 'build' ? "bg-primary/10" : "bg-secondary/10"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            variant === 'build' ? "text-primary" : "text-secondary-foreground"
          )} />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                variant === 'build' ? "text-primary" : "text-secondary-foreground"
              )} />
              <span className="text-muted-foreground">{bullet}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          asChild 
          className="w-full"
          variant={variant === 'build' ? 'default' : 'secondary'}
        >
          <Link to={ctaHref}>{ctaText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
