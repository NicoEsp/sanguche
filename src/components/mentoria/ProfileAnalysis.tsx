import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { AssessmentResult } from "@/utils/scoring";
import { memo } from "react";

interface ProfileAnalysisProps {
  result: AssessmentResult;
}

export const ProfileAnalysis = memo(function ProfileAnalysis({ result }: ProfileAnalysisProps) {
  const focusArea = result.gaps[0]?.label ?? result.neutralAreas[0]?.label ?? "Sin brechas críticas";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tu perfil de Product Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center text-center p-4 bg-primary/5 rounded-lg min-h-[110px]">
            <div className="text-2xl font-bold text-primary leading-tight">{result.nivel}</div>
            <div className="text-sm text-muted-foreground mt-1">Nivel actual</div>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-4 bg-secondary/50 rounded-lg min-h-[110px]">
            <div className="text-2xl font-bold text-foreground leading-tight">{result.promedioGlobal}/5</div>
            <div className="text-sm text-muted-foreground mt-1">Tu nota</div>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-4 bg-accent/50 rounded-lg min-h-[110px]">
            <div className="text-xl font-bold text-foreground leading-tight">{focusArea}</div>
            <div className="text-sm text-muted-foreground mt-1">A mejorar</div>
          </div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-foreground">{result.profileEstimate}</p>
        </div>
      </CardContent>
    </Card>
  );
});
