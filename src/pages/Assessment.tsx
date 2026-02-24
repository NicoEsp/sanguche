import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assessmentSchema, DOMAINS, OPTIONAL_DOMAINS, type AssessmentValues, type OptionalAssessmentValues, computeSeniorityScore, type DomainKey, type OptionalDomainKey, type AssessmentResult } from "@/utils/scoring";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { saveAssessment } from "@/utils/storage";
import { supabase } from "@/integrations/supabase/client";
import { DomainInfoPopup } from "@/components/DomainInfoPopup";
import { OptionalQuestionTooltip } from "@/components/OptionalQuestionTooltip";
import { Info, Star, Trophy, Target, Calendar, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSubscription } from "@/hooks/useSubscription";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

// Constantes para localStorage
const ASSESSMENT_IN_PROGRESS_KEY = 'assessment_in_progress';
const ASSESSMENT_PARTIAL_ANSWERS_KEY = 'assessment_partial_answers';

export default function Assessment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDomain, setSelectedDomain] = useState<DomainKey | null>(null);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [showReevaluationDialog, setShowReevaluationDialog] = useState(false);
  const [assessmentStartTime] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [optionalValues, setOptionalValues] = useState<OptionalAssessmentValues>({});
  
  // Estado local para mostrar resultados inmediatamente después de guardar
  const [localResult, setLocalResult] = useState<AssessmentResult | null>(null);
  const [localValues, setLocalValues] = useState<AssessmentValues | null>(null);
  
  const totalSteps = DOMAINS.length + OPTIONAL_DOMAINS.length;
  const { trackEvent, setUserProperties } = useMixpanelTracking();

  // Ref para trackear el tiempo en cada pregunta
  const questionStartTimeRef = useRef<number>(Date.now());

  const {
    result: savedResult,
    values: savedValues,
    hasAssessment,
    loading: assessmentLoading,
    updatedAt,
  } = useAssessmentData();

  const { hasActivePremium } = useSubscription();

  const form = useForm<AssessmentValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {} as AssessmentValues,
    mode: "onChange",
  });

  const watchedValues = useWatch<AssessmentValues>({ control: form.control });
  const persistenceTimeoutRef = useRef<number | null>(null);

  // Toast de bienvenida para usuarios nuevos
  useEffect(() => {
    const fromSignup = searchParams.get('from_signup') === 'true';
    if (fromSignup && !hasAssessment) {
      toast({
        title: "¡Bienvenido a ProductPrepa! 🎉",
        description: "Completa tu autoevaluación para obtener recomendaciones personalizadas.",
        duration: 5000,
      });
      // Limpiar parámetro
      searchParams.delete('from_signup');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, hasAssessment, setSearchParams]);

  useEffect(() => {
    if (!assessmentLoading) {
      // Verificar si hay una evaluación en progreso en localStorage
      const assessmentInProgress = localStorage.getItem(ASSESSMENT_IN_PROGRESS_KEY) === 'true';
      
      // Si hay assessment en progreso O no hay assessment guardado, mostrar formulario
      const shouldShowForm = assessmentInProgress || !hasAssessment;
      
      setIsReevaluating(shouldShowForm);
      
      // Si no hay assessment y tampoco había una en progreso, marcar como nueva
      if (!hasAssessment && !assessmentInProgress) {
        trackEvent('assessment_started');
        localStorage.setItem(ASSESSMENT_IN_PROGRESS_KEY, 'true');
      }
      
      // Si hay evaluación en progreso, recuperar respuestas parciales
      if (assessmentInProgress) {
        const partialAnswers = localStorage.getItem(ASSESSMENT_PARTIAL_ANSWERS_KEY);
        if (partialAnswers) {
            try {
              const parsedAnswers = JSON.parse(partialAnswers);
              form.reset(parsedAnswers);
              
              // Posicionar en el siguiente paso sin responder
              const answeredCount = Object.keys(parsedAnswers).length;
              setCurrentStep(Math.min(answeredCount, DOMAINS.length - 1));
          } catch (e) {
            if (import.meta.env.DEV) {
              console.error('Error recuperando respuestas parciales:', e);
            }
          }
        }
      }
    }
  }, [assessmentLoading, hasAssessment, trackEvent, form]);

  useEffect(() => {
    if (isReevaluating) {
      // Verificar si hay respuestas parciales guardadas
      const partialAnswers = localStorage.getItem(ASSESSMENT_PARTIAL_ANSWERS_KEY);
      
      if (partialAnswers) {
        // Si hay respuestas parciales, recuperarlas
        try {
          const parsedAnswers = JSON.parse(partialAnswers);
          form.reset(parsedAnswers);
        } catch (e) {
          if (import.meta.env.DEV) {
            console.error('Error recuperando respuestas parciales:', e);
          }
          form.reset({} as AssessmentValues);
        }
      } else {
        // Si no hay respuestas parciales, resetear a vacío
        form.reset({} as AssessmentValues);
      }
    }
  }, [isReevaluating, form]);

  // Refs para el evento de abandono (se inicializan después de `answered`)
  const isReevaluatingRef = useRef(isReevaluating);
  const currentStepRef = useRef(currentStep);
  const answeredRef = useRef(0);
  const assessmentStartTimeRef = useRef(assessmentStartTime);

  useEffect(() => { isReevaluatingRef.current = isReevaluating; }, [isReevaluating]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

  useEffect(() => {
    // Disparar assessment_abandoned al desmontar el componente o cerrar pestaña
    const fireAbandon = () => {
      if (!isReevaluatingRef.current) return;
      if (answeredRef.current === 0) return; // nunca respondió nada
      const timeSpent = Math.round((Date.now() - assessmentStartTimeRef.current) / 1000);
      trackEvent('assessment_abandoned', {
        last_question_number: currentStepRef.current + 1,
        questions_answered: answeredRef.current,
        total_questions: DOMAINS.length,
        progress_pct: Math.round((answeredRef.current / DOMAINS.length) * 100),
        time_spent_seconds: timeSpent,
      });
    };

    const handleBeforeUnload = () => fireAbandon();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      fireAbandon(); // component unmount (navegación interna)
    };
  }, [trackEvent]);

  // Guardar antes de cerrar la ventana/pestaña
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isReevaluating) return;
      
      const formValues = form.getValues();
      const hasAnswers = Object.values(formValues || {}).some((v) => typeof v === 'number');
      
      if (hasAnswers) {
        try {
          localStorage.setItem(ASSESSMENT_PARTIAL_ANSWERS_KEY, JSON.stringify(formValues));
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error guardando respuestas antes de cerrar:', error);
          }
        }
        
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isReevaluating, form]);

  useEffect(() => {
    if (!isReevaluating) {
      if (persistenceTimeoutRef.current !== null) {
        window.clearTimeout(persistenceTimeoutRef.current);
        persistenceTimeoutRef.current = null;
      }
      return;
    }

    if (!watchedValues) {
      return;
    }

    if (persistenceTimeoutRef.current !== null) {
      window.clearTimeout(persistenceTimeoutRef.current);
    }

    persistenceTimeoutRef.current = window.setTimeout(() => {
      persistenceTimeoutRef.current = null;
      const hasAnswers = Object.values(watchedValues || {}).some((v) => typeof v === 'number');
      if (!hasAnswers) {
        return;
      }

      const persist = () => {
        try {
          localStorage.setItem(ASSESSMENT_PARTIAL_ANSWERS_KEY, JSON.stringify(watchedValues));
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Error guardando respuestas parciales:', error);
          }
        }
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback?.(persist);
      } else {
        persist();
      }
    }, 400);

    return () => {
      if (persistenceTimeoutRef.current !== null) {
        window.clearTimeout(persistenceTimeoutRef.current);
        persistenceTimeoutRef.current = null;
      }
    };
  }, [watchedValues, isReevaluating]);

  const total = DOMAINS.length;
  const answered = useMemo(() => {
    if (!watchedValues) {
      return 0;
    }
    return Object.values(watchedValues).filter((v) => typeof v === "number").length;
  }, [watchedValues]);
  const progress = total ? Math.round((answered / total) * 100) : 0;
  useEffect(() => { answeredRef.current = answered; }, [answered]);

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
    setIsReevaluating(true);
    setCurrentStep(0);
    // Limpiar resultado local para permitir nueva evaluación
    setLocalResult(null);
    setLocalValues(null);
    // Marcar que hay una evaluación en progreso
    localStorage.setItem(ASSESSMENT_IN_PROGRESS_KEY, 'true');
    // Limpiar respuestas parciales previas
    localStorage.removeItem(ASSESSMENT_PARTIAL_ANSWERS_KEY);
  };

  // Helper para mensaje motivacional según progreso
  const getProgressMessage = useCallback((pct: number) => {
    if (pct >= 90) return "¡Un último esfuerzo!";
    if (pct >= 75) return "¡Ya casi terminás!";
    if (pct >= 50) return "Quedan las más difíciles, ya casi estás";
    if (pct >= 25) return "Vas bien. Las preguntas que siguen son fundamentales";
    return "";
  }, []);

  // Track per-question answer
  const trackQuestionAnswer = useCallback((questionId: string, questionNumber: number, answerValue: number, isOptional: boolean) => {
    const timeOnQuestion = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    trackEvent('assessment_question_answered', {
      question_number: questionNumber,
      question_id: questionId,
      answer_value: answerValue,
      is_optional: isOptional,
      time_on_question: timeOnQuestion,
    });
  }, [trackEvent]);

  // Reset question timer when step changes
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentStep]);

  const handleNextStep = () => {
    if (currentStep < DOMAINS.length) {
      const currentDomain = DOMAINS[currentStep];
      const currentValue = watchedValues?.[currentDomain.key];
      
      if (!currentValue) {
        toast({
          title: "Respuesta requerida",
          description: "Por favor seleccioná una opción antes de continuar.",
          variant: "destructive"
        });
        return;
      }
    }
    
    localStorage.setItem(ASSESSMENT_PARTIAL_ANSWERS_KEY, JSON.stringify(watchedValues));
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSkipOptional = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function onSubmit(data: AssessmentValues) {
    setIsSaving(true);
    
    try {
      // Solo pasar optionalValues si hay alguna respuesta
      const hasOptionalAnswers = Object.keys(optionalValues).length > 0;
      const result = computeSeniorityScore(data, hasOptionalAnswers ? optionalValues : undefined);
      const timeSpent = Math.round((Date.now() - assessmentStartTime) / 1000); // segundos
      
      // Guardar resultado localmente para mostrar inmediatamente
      setLocalResult(result);
      setLocalValues(data);
      
      // Guardar en servidor (async)
      await saveAssessment(data, hasOptionalAnswers ? optionalValues : undefined, result, supabase);
      
      // Invalidar cache para sincronizar con servidor
      await queryClient.invalidateQueries({ queryKey: ['assessment-data'] });
    
      // Track assessment completion
      trackEvent('assessment_completed', {
        total_score: result.promedioGlobal,
        estimated_level: result.nivel,
        time_spent_seconds: timeSpent,
        gaps_count: result.gaps?.length || 0,
        strengths_count: result.strengths?.length || 0
      });
      
      // Actualizar propiedades del usuario
      setUserProperties({
        assessment_completed: true,
        estimated_level: result.nivel,
        last_assessment_date: new Date().toISOString()
      });
        
      toast({ title: "Autoevaluación guardada", description: `Nivel estimado: ${result.nivel} (promedio ${result.promedioGlobal})` });
      
      // Limpiar las flags de evaluación en progreso
      localStorage.removeItem(ASSESSMENT_IN_PROGRESS_KEY);
      localStorage.removeItem(ASSESSMENT_PARTIAL_ANSWERS_KEY);
      
      // Resetear estado de re-evaluación para mostrar los resultados
      setIsReevaluating(false);
      isReevaluatingRef.current = false; // prevent abandon event on unmount
      
      // Scroll suave al top para que vea su resultado
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      // Limpiar resultado local en caso de error
      setLocalResult(null);
      setLocalValues(null);
      
      if (import.meta.env.DEV) {
        console.error('Error guardando evaluación:', error);
      }
      toast({ 
        title: "Error al guardar", 
        description: "Hubo un problema guardando tu evaluación. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Seo />
      <section className="container py-6 sm:py-10 px-4 sm:px-6 animate-fade-in">
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
        <p className="text-muted-foreground mb-4">
          {(hasAssessment || localResult) && !isReevaluating
            ? "Estos son tus resultados"
            : "Elegí la afirmación que mejor describa tu experiencia en cada dominio."}
        </p>

        {assessmentLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {/* Usar resultado local si existe, sino el del servidor */}
        {(() => {
          const effectiveResult = localResult || savedResult;
          const effectiveValues = localValues || savedValues;
          const effectiveHasAssessment = hasAssessment || !!localResult;
          
          return !assessmentLoading && effectiveHasAssessment && !isReevaluating && effectiveResult && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg border bg-card animate-fade-in hover:shadow-lg transition-all">
              <h2 className="text-lg font-semibold mb-4">Tu última autoevaluación</h2>
              
              {/* Promedio destacado en círculo */}
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <div className="relative">
                  <div className="w-36 h-36 rounded-full border-4 border-primary/20 bg-primary/5 flex flex-col items-center justify-center animate-scale-in">
                    <Star className="h-6 w-6 text-primary mb-1" />
                    <span className="text-4xl font-bold text-primary">
                      {effectiveResult.promedioGlobal}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      Promedio
                    </span>
                  </div>
                </div>
                
                {/* Profile estimate */}
                {effectiveResult.profileEstimate && (
                  <div className="text-sm text-center text-muted-foreground max-w-md mt-2">
                    <p className="mb-2">{effectiveResult.profileEstimate}</p>
                    {effectiveResult.ctaInfo && (
                      <Link 
                        to={hasActivePremium ? '/mentoria' : '/premium'}
                        className="text-primary hover:text-primary/80 font-medium underline transition-colors"
                      >
                        {effectiveResult.ctaInfo.text}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Información detallada con iconos + CTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Columna izquierda: Info existente */}
                <div className="space-y-3">
                  {/* Nivel estimado */}
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Nivel estimado:</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {effectiveResult.nivel}
                    </Badge>
                  </div>

                  {/* Especialización */}
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Especialización:</span>
                    <Badge variant="secondary">
                      {effectiveResult.specialization}
                    </Badge>
                  </div>

                  {/* Fecha de actualización */}
                  {formattedUpdatedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Actualizada el {formattedUpdatedAt}</span>
                    </div>
                  )}
                </div>

                {/* Columna derecha: CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-3">
                  {!hasActivePremium && (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary hover:text-white font-semibold transition-all duration-300"
                    >
                      <Link to="/planes" className="flex items-center gap-2">
                        <span>Quiero mejorar</span>
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Link to="/mejoras" className="flex items-center gap-2">
                      <span>Ver áreas de mejora</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {effectiveValues && (
              <div>
                <h3 className="text-base font-semibold mb-3">Tus respuestas guardadas</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {DOMAINS.map((d) => {
                    const score = effectiveValues ? effectiveValues[d.key] : undefined;
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
        );
        })()}

        {isReevaluating && (
          <>
            {/* Barra de progreso sticky unificada */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b shadow-sm p-4 mb-6 -mx-4 sm:mx-0 sm:rounded-lg sm:border">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-medium">
                    {currentStep < DOMAINS.length 
                      ? `Pregunta ${currentStep + 1} de ${DOMAINS.length}` 
                      : `Opcional ${currentStep - DOMAINS.length + 1} de ${OPTIONAL_DOMAINS.length}`
                    }
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-4" />
                {/* Mensaje motivacional */}
                {getProgressMessage(progress) && (
                  <p className="text-sm font-medium text-primary mt-2 text-center animate-fade-in">
                    {getProgressMessage(progress)}
                  </p>
                )}
                {/* Indicador de pasos */}
                <div className="flex gap-1 mt-3">
                  {DOMAINS.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        idx < currentStep ? 'bg-primary' : 
                        idx === currentStep ? 'bg-primary/60' : 
                        'bg-muted'
                      }`}
                    />
                  ))}
                  <div className="w-1" />
                  {OPTIONAL_DOMAINS.map((_, idx) => (
                    <div
                      key={`opt-${idx}`}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        DOMAINS.length + idx < currentStep ? 'bg-purple-500' : 
                        DOMAINS.length + idx === currentStep ? 'bg-purple-400' : 
                        'bg-purple-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {hasAssessment && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 max-w-2xl mx-auto">
                Estás por actualizar tu autoevaluación. Al guardar, tus resultados y áreas de mejora se recalcularán automáticamente.
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
                {/* Pregunta actual - siempre una sola card */}
                {currentStep < DOMAINS.length && (() => {
                  const d = DOMAINS[currentStep];
                  return (
                    <fieldset key={d.key} className="rounded-lg border p-5 sm:p-6 bg-card space-y-4 animate-fade-in">
                      <legend className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-base sm:text-lg leading-snug">
                            {d.question}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{d.label}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => setSelectedDomain(d.key)}
                          aria-label={`Ver más información sobre ${d.label}`}
                        >
                          <Info className="h-4 w-4" />
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
                                className="space-y-3"
                                value={field.value ? String(field.value) : undefined}
                                onValueChange={(val) => {
                                  const numVal = parseInt(val);
                                  field.onChange(numVal);
                                  trackQuestionAnswer(d.key, currentStep + 1, numVal, false);
                                }}
                              >
                                {d.statements.map((option) => {
                                  const optionId = `${d.key}-${option.value}`;
                                  const isSelected = field.value === option.value;
                                  return (
                                    <label
                                      key={option.value}
                                      htmlFor={optionId}
                                      className={`flex items-start gap-3 rounded-lg border p-3 sm:p-4 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary/40 ${
                                        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-input hover:bg-muted/40"
                                      }`}
                                    >
                                      <RadioGroupItem id={optionId} value={String(option.value)} className="mt-1" />
                                      <span className="text-sm sm:text-base leading-snug text-left">
                                        {option.label}
                                      </span>
                                    </label>
                                  );
                                })}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </fieldset>
                  );
                })()}

                {/* Pregunta opcional actual */}
                {currentStep >= DOMAINS.length && (() => {
                  const optIdx = currentStep - DOMAINS.length;
                  const d = OPTIONAL_DOMAINS[optIdx];
                  if (!d) return null;
                  const currentOptionalValue = optionalValues[d.key as keyof OptionalAssessmentValues];

                  return (
                    <div className="space-y-4 animate-fade-in">
                      {/* Header opcionales - solo en la primera opcional */}
                      {optIdx === 0 && (
                        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                          <h3 className="text-sm font-medium text-purple-800 flex items-center gap-2">
                            🟣 Dominios opcionales
                          </h3>
                          <p className="text-xs text-purple-600 mt-1">
                            Estas preguntas son opcionales y no impactan tu puntaje general.
                          </p>
                        </div>
                      )}
                      
                      <fieldset className="rounded-lg border border-purple-200 p-5 sm:p-6 bg-card space-y-4">
                        <legend className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="border-purple-300 text-purple-700 text-xs">
                                Opcional · no afecta tu puntaje
                              </Badge>
                              <OptionalQuestionTooltip />
                            </div>
                            <p className="font-semibold text-base sm:text-lg leading-snug">
                              {d.question}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{d.label}</p>
                          </div>
                        </legend>
                        <RadioGroup
                          className="space-y-3"
                          value={currentOptionalValue ? String(currentOptionalValue) : undefined}
                          onValueChange={(val) => {
                            const numVal = parseInt(val);
                            setOptionalValues(prev => ({
                              ...prev,
                              [d.key]: numVal
                            }));
                            trackQuestionAnswer(d.key, currentStep + 1, numVal, true);
                          }}
                        >
                          {d.statements.map((option) => {
                            const optionId = `optional-${d.key}-${option.value}`;
                            const isSelected = currentOptionalValue === option.value;
                            return (
                              <label
                                key={option.value}
                                htmlFor={optionId}
                                className={`flex items-start gap-3 rounded-lg border p-3 sm:p-4 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-purple-400/40 ${
                                  isSelected ? "border-purple-400 bg-purple-50 shadow-sm" : "border-input hover:bg-muted/40"
                                }`}
                              >
                                <RadioGroupItem id={optionId} value={String(option.value)} className="mt-1" />
                                <span className="text-sm sm:text-base leading-snug text-left">
                                  {option.label}
                                </span>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </fieldset>
                    </div>
                  );
                })()}

                {/* Navegación unificada */}
                <div className="flex gap-3 mt-6">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="w-full"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                  )}
                  {currentStep < DOMAINS.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full"
                      disabled={!watchedValues?.[DOMAINS[currentStep].key]}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : currentStep === DOMAINS.length - 1 ? (
                    <>
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full"
                        disabled={!watchedValues?.[DOMAINS[currentStep].key]}
                      >
                        Siguiente (Opcionales)
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full mt-2"
                        disabled={isSaving || answered < DOMAINS.length}
                      >
                        {isSaving ? "Guardando..." : "Ver resultados"}
                      </Button>
                    </>
                  ) : currentStep < totalSteps - 1 ? (
                    <div className="flex gap-2 w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSkipOptional}
                        className="flex-1"
                      >
                        Saltar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="flex-1"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2 w-full">
                        <Button
                          type="submit"
                          variant="outline"
                          className="flex-1"
                          disabled={isSaving}
                        >
                          {isSaving ? "Guardando..." : "Saltar y ver resultados"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            form.handleSubmit(onSubmit)();
                          }}
                          className="flex-1"
                          disabled={isSaving || !optionalValues[OPTIONAL_DOMAINS[currentStep - DOMAINS.length]?.key as keyof OptionalAssessmentValues]}
                        >
                          {isSaving ? (
                            <>
                              <span className="inline-block animate-spin mr-2">⏳</span>
                              Guardando...
                            </>
                          ) : (
                            'Guardar y ver resultados'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
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
