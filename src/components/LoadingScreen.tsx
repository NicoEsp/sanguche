import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SkeletonProgress from "@/components/skeletons/SkeletonProgress";
import SkeletonAssessment from "@/components/skeletons/SkeletonAssessment";
import SkeletonMejoras from "@/components/skeletons/SkeletonMejoras";

interface LoadingScreenProps {
  isFading?: boolean;
  variant?: 'spinner' | 'skeleton';
  destination?: '/progreso' | '/mejoras' | '/autoevaluacion' | string | null;
}

// Skeleton genérico como fallback
function GenericSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Content skeleton - 3 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Additional content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

export function LoadingScreen({ isFading = false, variant = 'spinner', destination = null }: LoadingScreenProps) {
  if (variant === 'skeleton') {
    const renderSkeleton = () => {
      switch (destination) {
        case '/progreso':
          return <SkeletonProgress />;
        case '/autoevaluacion':
          return <SkeletonAssessment />;
        case '/mejoras':
          return <SkeletonMejoras />;
        default:
          return <GenericSkeleton />;
      }
    };

    return (
      <div 
        className={cn(
          "min-h-screen bg-background",
          isFading && "animate-fade-out"
        )}
      >
        {renderSkeleton()}
      </div>
    );
  }

  // Spinner variant (default)
  return (
    <div 
      className={cn(
        "min-h-screen flex items-center justify-center bg-background",
        isFading && "animate-fade-out"
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}
