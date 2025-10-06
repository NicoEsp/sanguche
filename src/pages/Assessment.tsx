import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assessmentSchema, DOMAINS, type AssessmentValues, computeSeniorityScore, type DomainKey } from "@/utils/scoring";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { saveAssessment } from "@/utils/storage";
import { supabase } from "@/integrations/supabase/client";
import { DomainInfoPopup } from "@/components/DomainInfoPopup";
import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssessmentData } from "@/hooks/useAssessmentData";

export default function Assessment() {
  const navigate = useNavigate();
  const [showDiagnosticQuestions, setShowDiagnosticQuestions] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainKey | null>(null);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<DomainKey, boolean>>({} as Record<DomainKey, boolean>);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [showReevaluationDialog, setShowReevaluationDialog] = useState(false);

  const {
    result: savedResult,
    values: savedValues,
    hasAssessment,
    loading: assessmentLoading,
    updatedAt,
  } = useAssessmentData();

  const form = useForm<AssessmentValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {} as AssessmentValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!assessmentLoading) {
      setIsReevaluating(!hasAssessment);
    }
  }, [assessmentLoading, hasAssessment]);

  useEffect(() => {
    if (isReevaluating) {
      if (savedValues) {
        form.reset(savedValues);
      } else {
        form.reset({} as AssessmentValues);
      }
    }
  }, [isReevaluating, savedValues, form]);

  const values = form.watch();
  const total = DOMAINS.length;
  const answered = Object.values(values || {}).filter((v) => typeof v === "number").length;
  const progress = Math.round((answered / total) * 100);

  const formattedUpdatedAt = useMemo(() => {
    if (!updatedAt) return null;
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  }, [updatedAt]);

  const handleStartReevaluation = () => {
    setShowDiagnosticQuestions(false);
    setDiagnosticAnswers({} as Record<DomainKey, boolean>);
    setIsReevaluating(true);
  };

  async function onSubmit(data: AssessmentValues) {
    const result = computeSeniorityScore(data);
    await saveAssessment(data, result, supabase);
    toast({ title: "Autoevaluación guardada", description: `Nivel estimado: ${result.nivel} (promedio ${result.promedioGlobal})` });
    navigate("/mejoras");
  }

  return (
    <>
      <Seo
        title="Autoevaluación PM — ProductPrepa"
        description="Evalúa tu nivel de seniority en Product Management."
        canonical="/autoevaluacion"
      />
      <section className="container py-6 sm:py-10 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h1 className="text-2xl sm:text-3xl font-semibold">Autoevaluación de seniority</h1>
          {hasAssessment && (
            <AlertDialog open={showReevaluationDialog} onOpenChange={setShowReevaluationDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="sm:w-auto w-full">
                  Volver a evaluarme
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Los resultados de tu evaluación cambiarán por ende tus Áreas de Mejora también. Tenelo presente antes de avanzar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowReevaluationDialog(false);
                      handleStartReevaluation();
                    }}
                  >
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <p className="text-muted-foreground mb-4">Responde del 1 al 5 según tu dominio en cada área.</p>

        {assessmentLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {!assessmentLoading && hasAssessment && !isReevaluating && savedResult && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg border bg-card">
              <h2 className="text-lg font-semibold mb-2">Tu última autoevaluación</h2>
              <p className="text-sm text-muted-foreground">
                Nivel estimado: <strong>{savedResult.nivel}</strong> (promedio {savedResult.promedioGlobal}).
              </p>
              <p className="text-sm text-muted-foreground mt-2">{savedResult.profileEstimate}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Especialización: <strong>{savedResult.specialization}</strong>
              </p>
              {formattedUpdatedAt && (
                <p className="text-xs text-muted-foreground mt-3">Actualizada el {formattedUpdatedAt}</p>
              )}
            </div>

            {savedValues && (
              <div>
                <h3 className="text-base font-semibold mb-3">Tus respuestas guardadas</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {DOMAINS.map((d) => {
                    const score = savedValues ? savedValues[d.key] : undefined;
                    return (
                      <div key={d.key} className="rounded-md border p-4 bg-card">
                        <div className="font-medium">{d.label}</div>
                        <div className="text-sm text-muted-foreground">Puntaje: {score ?? "-"} / 5</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="w-full sm:w-auto">
                <Link to="/mejoras">Ver mis resultados detallados</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowReevaluationDialog(true)}
              >
                Volver a evaluarme
              </Button>
            </div>
          </div>
        )}

        {isReevaluating && (
          <>
            <div className="flex items-center justify-between mb-6 p-4 rounded-lg border bg-card">
              <div>
                <h3 className="font-medium">Preguntas diagnósticas</h3>
                <p className="text-sm text-muted-foreground">Incluir preguntas adicionales de diagnóstico para una evaluación más detallada</p>
              </div>
              <Switch
                checked={showDiagnosticQuestions}
                onCheckedChange={setShowDiagnosticQuestions}
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span>Progreso</span>
                <span>{answered}/{total} ({progress}%)</span>
              </div>
              <Progress value={progress} />
            </div>

            {hasAssessment && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Estás por actualizar tu autoevaluación. Al guardar, tus resultados y áreas de mejora se recalcularán automáticamente.
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6">
                  {DOMAINS.map((d) => (
                    <fieldset key={d.key} className="rounded-lg border p-4 bg-card">
                      <legend className="font-medium mb-3 flex items-center gap-2">
                        {d.label}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => setSelectedDomain(d.key)}
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </legend>
                      <FormField
                        control={form.control}
                        name={d.key as keyof AssessmentValues}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">{d.label}</FormLabel>
                            <FormControl>
                              <RadioGroup
                                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3"
                                value={field.value ? String(field.value) : undefined}
                                onValueChange={(val) => field.onChange(parseInt(val))}
                              >
                                {[1,2,3,4,5].map((n) => (
                                  <label key={n} className="flex items-center gap-2 rounded-md border p-2 sm:p-3 cursor-pointer min-h-[44px] hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value={String(n)} />
                                    <span className="text-xs sm:text-sm leading-tight">
                                      {n} <span className="hidden sm:inline">{n===1?"(Novato)":n===2?"(Básico)":n===3?"(Intermedio)":n===4?"(Avanzado)":"(Experto)"}</span>
                                    </span>
                                  </label>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {showDiagnosticQuestions && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/50 border-l-4 border-primary">
                          <h4 className="text-sm font-medium mb-2">Pregunta diagnóstica:</h4>
                          <p className="text-sm mb-3">{d.diagnosticQuestion}</p>
                          <RadioGroup
                            className="flex gap-4"
                            value={diagnosticAnswers[d.key] !== undefined ? String(diagnosticAnswers[d.key]) : undefined}
                            onValueChange={(val) => setDiagnosticAnswers(prev => ({ ...prev, [d.key]: val === "true" }))}
                          >
                            <label className="flex items-center gap-2 cursor-pointer">
                              <RadioGroupItem value="true" />
                              <span className="text-sm">Sí</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <RadioGroupItem value="false" />
                              <span className="text-sm">No</span>
                            </label>
                          </RadioGroup>
                        </div>
                      )}
                    </fieldset>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="w-full sm:w-auto">Guardar y continuar</Button>
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link to="/">Volver</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}

        <DomainInfoPopup
          domainKey={selectedDomain!}
          isOpen={selectedDomain !== null}
          onClose={() => setSelectedDomain(null)}
        />
      </section>
    </>
  );
}
