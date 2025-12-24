import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  isFading?: boolean;
}

export function LoadingScreen({ isFading = false }: LoadingScreenProps) {
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
