import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, FileText, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface CareerPathHeaderProps {
  totalObjectives: number;
  completedCount: number;
  completionRate: number;
  isMapLocked: boolean;
  isExportingPdf: boolean;
  onSave: () => void;
  onExport: () => void;
}

export function CareerPathHeader({
  totalObjectives,
  completedCount,
  completionRate,
  isMapLocked,
  isExportingPdf,
  onSave,
  onExport,
}: CareerPathHeaderProps) {
  const hasObjectives = totalObjectives > 0;

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit text-primary border-primary/40 bg-primary/5">
            Premium exclusivo
          </Badge>

          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              Tu Career Path
            </h1>

            <div className="flex items-center gap-3 print:hidden">
              {!isMapLocked && hasObjectives && (
                <Button onClick={onSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Career Path
                </Button>
              )}

              {hasObjectives && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Button
                          disabled={!isMapLocked || isExportingPdf}
                          variant="outline"
                          className={cn(
                            "gap-2",
                            !isMapLocked && "cursor-not-allowed",
                            isExportingPdf && "pointer-events-none opacity-80"
                          )}
                          onClick={isMapLocked ? onExport : undefined}
                        >
                          {isExportingPdf ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generando PDF...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4" />
                              Exportar PDF
                            </>
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isMapLocked
                        ? "Descargá tu Career Path en PDF"
                        : "Primero debes guardar tu Career Path para exportarlo"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border shadow-sm rounded-xl px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Completados</p>
                <p className="text-2xl md:text-3xl font-semibold">
                  {completedCount}
                  <span className="text-base text-muted-foreground">/{totalObjectives}</span>
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-[200px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Avance</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <ProgressBar
                value={completionRate}
                className={cn(
                  "h-2",
                  completionRate === 100 && "[&>div]:bg-emerald-500"
                )}
              />
            </div>

            {completionRate === 100 && hasObjectives && (
              <Badge className="bg-emerald-500 text-white hidden sm:flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                ¡Completado!
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm md:text-base text-muted-foreground">
          Arrastra objetivos sugeridos por ProductPrepa o creados en mentorías con NicoProducto para
          dar forma a tu Career Path. Agrúpalos por horizonte temporal y hacé seguimiento del avance
          paso a paso.
        </p>
      </div>
    </header>
  );
}
