import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { AssessmentResult } from "@/utils/scoring";
import { memo } from "react";

interface ProfileAnalysisProps {
  result: AssessmentResult;
}

export const ProfileAnalysis = memo(function ProfileAnalysis({ result }: ProfileAnalysisProps) {
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
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <div className="text-2xl font-bold text-primary">{result.nivel}</div>
            <div className="text-sm text-muted-foreground">Nivel actual</div>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{result.promedioGlobal}/5</div>
            <div className="text-sm text-muted-foreground">Promedio global</div>
          </div>
          <div className="text-center p-4 bg-accent/50 rounded-lg">
            <div className="text-sm font-bold text-foreground">{result.specialization}</div>
            <div className="text-sm text-muted-foreground">Especialización</div>
          </div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-foreground">{result.profileEstimate}</p>
        </div>
      </CardContent>
    </Card>
  );
});
