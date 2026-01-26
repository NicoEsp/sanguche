import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonMejoras() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header: Título + descripción */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-3/4 max-w-md" />
        <Skeleton className="h-5 w-1/2 max-w-sm" />
      </div>
      
      {/* Sección: Tus fortalezas */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
      </div>
      
      {/* Sección: Competencias sólidas */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
      </div>
      
      {/* Sección: Áreas de mejora */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-44" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-md" />
          ))}
        </div>
      </div>
      
      {/* CTAs */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
