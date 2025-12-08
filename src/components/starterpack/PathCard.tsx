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
      "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      variant === 'build' 
        ? "border-2 border-primary/30 hover:border-primary bg-gradient-to-br from-primary/5 via-transparent to-primary/10" 
        : "border-2 border-purple-500/30 hover:border-purple-500 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/10"
    )}>
      {/* Top accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        variant === 'build' ? "bg-primary" : "bg-purple-500"
      )} />
      
      <CardHeader className="pb-4 pt-6">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
          variant === 'build' 
            ? "bg-primary/15 ring-2 ring-primary/20" 
            : "bg-purple-500/15 ring-2 ring-purple-500/20"
        )}>
          <Icon className={cn(
            "w-8 h-8",
            variant === 'build' ? "text-primary" : "text-purple-500"
          )} />
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <p className="text-muted-foreground mt-1">{description}</p>
      </CardHeader>
      
      <CardContent className="space-y-5">
        <ul className="space-y-3">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-3 text-sm">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                variant === 'build' ? "bg-primary/15" : "bg-purple-500/15"
              )}>
                <Check className={cn(
                  "w-3 h-3",
                  variant === 'build' ? "text-primary" : "text-purple-500"
                )} />
              </div>
              <span className="text-foreground/80">{bullet}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          asChild 
          className={cn(
            "w-full h-12 text-base font-semibold transition-all duration-300",
            variant === 'build' 
              ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40" 
              : "bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
          )}
        >
          <Link to={ctaHref}>{ctaText}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
