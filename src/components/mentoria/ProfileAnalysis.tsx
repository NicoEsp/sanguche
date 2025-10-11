import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, BarChart3 } from "lucide-react";
import { AssessmentResult } from "@/utils/scoring";
import { memo } from "react";

interface ProfileAnalysisProps {
  result: AssessmentResult;
}

export const ProfileAnalysis = memo(function ProfileAnalysis({ result }: ProfileAnalysisProps) {
  return (
    <div className="space-y-6">
      {/* Tu perfil de PM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tu perfil de PM
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
              <div className="text-sm font-medium text-foreground">Especialización</div>
              <div className="text-sm text-muted-foreground">{result.specialization}</div>
            </div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-foreground">{result.profileEstimate}</p>
          </div>
        </CardContent>
      </Card>

      {/* Áreas de oportunidad identificadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-warning" />
            Áreas de oportunidad identificadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.neutralAreas && result.neutralAreas.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Estas áreas tienen potencial de crecimiento para llevarte al siguiente nivel:
              </p>
              <div className="grid gap-3">
                {result.neutralAreas?.map((area, index) => (
                  <div key={area.key} className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{area.label}</div>
                      <div className="text-sm text-muted-foreground">
                        Nivel actual: {area.value}/5 • Objetivo: 4+/5
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-warning/10 text-warning-foreground">
                      {area.value === 3 ? "Desarrollo" : "Optimización"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">¡Excelente perfil!</h3>
              <p className="text-sm text-muted-foreground">
                No se detectaron áreas de oportunidad significativas. Tu perfil está muy equilibrado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});