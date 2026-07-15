import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import {
  ASSESSMENT_TYPES,
  DOMAINS,
  OPTIONAL_DOMAINS,
  CONTEXT_QUESTIONS,
  type AnyAssessmentValues,
  type AssessmentContext,
  type AssessmentTypeKey,
  type OptionalAssessmentValues,
  computeSeniorityScore,
  getAssessmentSchema,
  getAssessmentTypeDef,
  getDomainsForType,
  getNivelDisplay,
  type AnyDomainKey,
  type AssessmentResult,
} from "@/utils/scoring";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { saveAssessment } from "@/utils/storage";
import { DomainInfoPopup } from "@/components/DomainInfoPopup";
import { OptionalQuestionTooltip } from "@/components/OptionalQuestionTooltip";
import { AssessmentTypeSelector } from "@/components/assessment/AssessmentTypeSelector";
import { Info, Star, Trophy, Target, Calendar, ArrowRight, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
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
const ASSESSMENT_OPTIONAL_ANSWERS_KEY = 'assessment_optional_answers';
const ASSESSMENT_TYPE_KEY = 'assessment_selected_type';
const ASSESSMENT_CONTEXT_KEY = 'assessment_context_answers';
// localStorage es por navegador, no por cuenta: sin este dueño, una cuenta
// nueva en el mismo navegador heredaría la evaluación a medias de otra.
const ASSESSMENT_OWNER_KEY = 'assessment_progress_owner';

const VALID_TYPES: readonly AssessmentTypeKey[] = ASSESSMENT_TYPES.map((t) => t.key);

// Parsea respuestas guardadas en localStorage descartando claves desconocidas
// o valores corruptos (solo acepta enteros entre 1 y 5 de dominios válidos).
function parseStoredAnswers<T extends string>(
  raw: string | null,
  validKeys: readonly T[]
): Partial<Record<T, number>> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const answers: Partial<Record<T, number>> = {};
    for (const key of validKeys) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) {
        answers[key] = value;
      }
    }
    return answers;
  } catch {
    return {};
  }
}

function parseStoredContext(raw: string | null): AssessmentContext {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const source = parsed as Record<string, unknown>;
    const context: AssessmentContext = {};
    if (source.rolInteres === 'pm' || source.rolInteres === 'diseno' || source.rolInteres === 'dev' || source.rolInteres === 'no_seguro') {
      context.rolInteres = source.rolInteres;
    }
    if (source.etapa === 'idea' || source.etapa === 'mvp' || source.etapa === 'usuarios' || source.etapa === 'ingresos') {
      context.etapa = source.etapa;
    }
    if (typeof source.detalle === 'string' && source.detalle.trim() !== '') {
      context.detalle = source.detalle;
    }
    return context;
  } catch {
    return {};
  }
}

export default function Assessment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDomain, setSelectedDomain] = useState<AnyDomainKey | null>(null);
  const [selectedType, setSelectedType] = useState<AssessmentTypeKey | null>(null);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [showReevaluationDialog, setShowReevaluationDialog] = useState(false);
  const [showChangeTypeDialog, setShowChangeTypeDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [optionalValues, setOptionalValues] = useState<OptionalAssessmentValues>({});
  const [contextValues, setContextValues] = useState<AssessmentContext>({});

  // Estado local para mostrar resultados inmediatamente después de guardar
  const [localResult, setLocalResult] = useState<AssessmentResult | null>(null);
  const [localValues, setLocalValues] = useState<AnyAssessmentValues | null>(null);

  const { trackEvent, setUserProperties } = useMixpanelTracking();

  // Ref para trackear el tiempo en cada pregunta
  const questionStartTimeRef = useRef<number>(Date.now());

  const {
    result: savedResult,
    values: savedValues,
    hasAssessment,
    loading: assessmentLoading,
    updatedAt,
    assessmentType: savedAssessmentType,
  } = useAssessmentData();

  const { hasActivePremium } = useSubscription();
  const { user, isLoading: authLoading } = useAuth();

  // El set de preguntas depende de la evaluación elegida. Mientras no hay
  // tipo elegido se usa el de la evaluación con experiencia (solo para
  // mantener estables los hooks; el wizard no se muestra sin tipo).
  const activeType: AssessmentTypeKey = selectedType ?? 'experimentado';
  const isExperimentado = activeType === 'experimentado';
  const activeDomains = useMemo(() => getDomainsForType(activeType), [activeType]);
  const contextDef = isExperimentado ? undefined : CONTEXT_QUESTIONS[activeType];
  const extraSteps = isExperimentado ? OPTIONAL_DOMAINS.length : (contextDef ? 1 : 0);
  const totalSteps = activeDomains.length + extraSteps;
  const activeTypeDef = getAssessmentTypeDef(activeType);

  // La validación por schema ocurre al enviar (getAssessmentSchema depende
  // del tipo elegido); el avance pregunta a pregunta ya exige respuesta.
  const form = useForm<AnyAssessmentValues>({
    defaultValues: {},
    mode: "onChange",
  });

  const watchedValues = useWatch<AnyAssessmentValues>({ control: form.control });
  const persistenceTimeoutRef = useRef<number | null>(null);

  // Toast de bienvenida para usuarios nuevos
  useEffect(() => {
    const fromSignup = searchParams.get('from_signup') === 'true';
    if (fromSignup && !hasAssessment) {
      toast({
        title: "¡Bienvenido a ProductPrepa! 🎉",
        description: "Completá tu evaluación para obtener recomendaciones personalizadas.",
        duration: 5000,
      });
      // Limpiar parámetro
      searchParams.delete('from_signup');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, hasAssessment, setSearchParams]);

  // Inicialización única al resolver la carga: decide si mostrar el selector,
  // el formulario o los resultados, y recupera una evaluación en progreso.
  // El guard evita que cambios de identidad en `trackEvent` (auth)
  // re-ejecuten el efecto y pisen el formulario a mitad de una evaluación.
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (assessmentLoading || authLoading || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // El progreso guardado solo vale para la cuenta que lo dejó: otra cuenta
    // en el mismo navegador arranca de cero (y se limpia lo ajeno).
    const storedOwner = localStorage.getItem(ASSESSMENT_OWNER_KEY);
    const ownsStoredProgress = storedOwner === (user?.id ?? null);
    if (localStorage.getItem(ASSESSMENT_IN_PROGRESS_KEY) === 'true' && !ownsStoredProgress) {
      localStorage.removeItem(ASSESSMENT_IN_PROGRESS_KEY);
      localStorage.removeItem(ASSESSMENT_PARTIAL_ANSWERS_KEY);
      localStorage.removeItem(ASSESSMENT_OPTIONAL_ANSWERS_KEY);
      localStorage.removeItem(ASSESSMENT_TYPE_KEY);
      localStorage.removeItem(ASSESSMENT_CONTEXT_KEY);
      localStorage.removeItem(ASSESSMENT_OWNER_KEY);
    }

    const assessmentInProgress = localStorage.getItem(ASSESSMENT_IN_PROGRESS_KEY) === 'true';
    const storedTypeRaw = localStorage.getItem(ASSESSMENT_TYPE_KEY) as AssessmentTypeKey | null;
    const storedType = storedTypeRaw && VALID_TYPES.includes(storedTypeRaw) ? storedTypeRaw : null;
    const wantsReevaluation = searchParams.get('reevaluar') === '1';

    if (wantsReevaluation) {
      searchParams.delete('reevaluar');
      setSearchParams(searchParams, { replace: true });
    }

    // Recuperar el tipo elegido; una evaluación empezada antes de que
    // existieran los perfiles se retoma como "experimentado" (era la única).
    const resumeType: AssessmentTypeKey = storedType ?? 'experimentado';
    const resumeDomains = getDomainsForType(resumeType);
    const restoredValues = assessmentInProgress
      ? parseStoredAnswers(
          localStorage.getItem(ASSESSMENT_PARTIAL_ANSWERS_KEY),
          resumeDomains.map((d) => d.key)
        )
      : {};
    const hasStoredProgress = Object.keys(restoredValues).length > 0;

    // Pedido explícito de re-evaluación (banner de /mejoras): arranca desde
    // el selector, salvo que haya una evaluación a medias con respuestas, en
    // cuyo caso se retoma esa (no se descarta trabajo sin confirmación).
    if (wantsReevaluation && !hasStoredProgress) {
      localStorage.removeItem(ASSESSMENT_PARTIAL_ANSWERS_KEY);
      localStorage.removeItem(ASSESSMENT_OPTIONAL_ANSWERS_KEY);
      localStorage.removeItem(ASSESSMENT_TYPE_KEY);
      localStorage.removeItem(ASSESSMENT_CONTEXT_KEY);
      // Persistir la intención: si recarga en el selector, vuelve al selector.
      localStorage.setItem(ASSESSMENT_IN_PROGRESS_KEY, 'true');
      if (user?.id) localStorage.setItem(ASSESSMENT_OWNER_KEY, user.id);
      setIsReevaluating(true);
      return;
    }

    // Si hay assessment en progreso O no hay assessment guardado, mostrar
    // el flujo de evaluación (selector primero si aún no eligió tipo).
    setIsReevaluating(assessmentInProgress || !hasAssessment);

    if (assessmentInProgress) {
      // Re-evaluación confirmada que quedó en el selector (sin tipo elegido
      // ni respuestas): mantener el selector en vez de forzar un tipo.
      if (!storedType && !hasStoredProgress) {
        return;
      }

      setSelectedType(resumeType);

      const restoredOptional = resumeType === 'experimentado'
        ? parseStoredAnswers(
            localStorage.getItem(ASSESSMENT_OPTIONAL_ANSWERS_KEY),
            OPTIONAL_DOMAINS.map((d) => d.key)
          )
        : {};
      const restoredContext = resumeType === 'experimentado'
        ? {}
        : parseStoredContext(localStorage.getItem(ASSESSMENT_CONTEXT_KEY));

      if (Object.keys(restoredValues).length > 0) {
        form.reset(restoredValues);
      }
      if (Object.keys(restoredOptional).length > 0) {
        setOptionalValues(restoredOptional);
      }
      if (Object.keys(restoredContext).length > 0) {
        setContextValues(restoredContext);
      }

      // Posicionar en la primera pregunta sin responder
      const firstUnanswered = resumeDomains.findIndex((d) => typeof restoredValues[d.key] !== 'number');
      if (firstUnanswered !== -1) {
        setCurrentStep(firstUnanswered);
      } else if (resumeType === 'experimentado') {
        const firstUnansweredOptional = OPTIONAL_DOMAINS.findIndex(
          (d) => typeof restoredOptional[d.key] !== 'number'
        );
        setCurrentStep(
          firstUnansweredOptional === -1
            ? resumeDomains.length + OPTIONAL_DOMAINS.length - 1
            : resumeDomains.length + firstUnansweredOptional
        );
      } else {
        setCurrentStep(resumeDomains.length);
      }
    }
  }, [assessmentLoading, authLoading, hasAssessment, form, searchParams, setSearchParams, user]);

  // Refs para el evento de abandono (se inicializan después de `answered`)
  const isReevaluatingRef = useRef(isReevaluating);
  const currentStepRef = useRef(currentStep);
  const answeredRef = useRef(0);
  const totalQuestionsRef = useRef(DOMAINS.length);
  const selectedTypeRef = useRef<AssessmentTypeKey | null>(selectedType);
  const assessmentStartTimeRef = useRef(Date.now());
  const completedThisSessionRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const hasTrackedAbandonRef = useRef(false);
  // Stable ref for trackEvent so the abandon effect never re-runs (prevents
  // cleanup from firing a premature abandon when auth/user changes trackEvent's identity)
  const trackEventRef = useRef(trackEvent);
  useEffect(() => { trackEventRef.current = trackEvent; }, [trackEvent]);

  useEffect(() => { isReevaluatingRef.current = isReevaluating; }, [isReevaluating]);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { totalQuestionsRef.current = activeDomains.length; }, [activeDomains]);
  useEffect(() => { selectedTypeRef.current = selectedType; }, [selectedType]);

  useEffect(() => {
    // Disparar assessment_abandoned al desmontar el componente o cerrar pestaña
    const fireAbandon = () => {
      if (hasTrackedAbandonRef.current) return; // ya se disparó, nunca duplicar
      if (completedThisSessionRef.current) return; // completó en esta sesión
      if (!sessionActiveRef.current) return; // nunca interactuó activamente
      if (!isReevaluatingRef.current) return;
      if (answeredRef.current === 0) return; // nunca respondió nada
      hasTrackedAbandonRef.current = true;
      const timeSpent = Math.round((Date.now() - assessmentStartTimeRef.current) / 1000);
      const answered = answeredRef.current;
      const totalQuestions = totalQuestionsRef.current || 1;
      trackEventRef.current('assessment_abandoned', {
        last_question_answered: answered,
        current_step: currentStepRef.current + 1,
        questions_answered: answered,
        total_questions: totalQuestions,
        completion_percentage: Math.round((answered / totalQuestions) * 100),
        time_in_assessment: timeSpent,
        assessment_type: selectedTypeRef.current ?? 'experimentado',
      });
    };

    const handleBeforeUnload = () => fireAbandon();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      fireAbandon(); // component unmount (navegación interna)
    };
  }, []);

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

  const total = activeDomains.length;
  const answered = useMemo(() => {
    if (!watchedValues) {
      return 0;
    }
    return activeDomains.filter((d) => typeof watchedValues[d.key] === "number").length;
  }, [watchedValues, activeDomains]);
  const progress = total ? Math.round((answered / total) * 100) : 0;
  useEffect(() => {
    answeredRef.current = answered;
    if (answered > 0 && isReevaluating) {
      sessionActiveRef.current = true;
    }
  }, [answered, isReevaluating]);

  const formattedUpdatedAt = useMemo(() => {
    if (!updatedAt) return null;
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  }, [updatedAt]);

  const clearProgressStorage = () => {
    localStorage.removeItem(ASSESSMENT_IN_PROGRESS_KEY);
    localStorage.removeItem(ASSESSMENT_PARTIAL_ANSWERS_KEY);
    localStorage.removeItem(ASSESSMENT_OPTIONAL_ANSWERS_KEY);
    localStorage.removeItem(ASSESSMENT_TYPE_KEY);
    localStorage.removeItem(ASSESSMENT_CONTEXT_KEY);
    localStorage.removeItem(ASSESSMENT_OWNER_KEY);
  };

  // Vuelve al selector de perfil (re-evaluación o cambio de evaluación a
  // mitad de camino). El evento assessment_started se dispara al elegir tipo.
  const handleStartReevaluation = () => {
    setIsReevaluating(true);
    setSelectedType(null);
    setCurrentStep(0);
    // Limpiar resultado local para permitir nueva evaluación
    setLocalResult(null);
    setLocalValues(null);
    setOptionalValues({});
    setContextValues({});
    form.reset({});
    // Reset de refs de tracking para permitir que un nuevo abandono (o completion) dispare en esta sesión
    completedThisSessionRef.current = false;
    sessionActiveRef.current = false;
    hasTrackedAbandonRef.current = false;
    assessmentStartTimeRef.current = Date.now();
    clearProgressStorage();
    // Persistir la intención de re-evaluar: si recarga estando en el
    // selector, vuelve al selector en vez de a sus resultados anteriores.
    localStorage.setItem(ASSESSMENT_IN_PROGRESS_KEY, 'true');
    if (user?.id) localStorage.setItem(ASSESSMENT_OWNER_KEY, user.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // El usuario eligió su perfil: arranca el wizard de esa evaluación.
  const handleSelectType = (type: AssessmentTypeKey) => {
    setSelectedType(type);
    setCurrentStep(0);
    setOptionalValues({});
    setContextValues({});
    form.reset({});
    completedThisSessionRef.current = false;
    sessionActiveRef.current = false;
    hasTrackedAbandonRef.current = false;
    assessmentStartTimeRef.current = Date.now();
    localStorage.setItem(ASSESSMENT_IN_PROGRESS_KEY, 'true');
    localStorage.setItem(ASSESSMENT_TYPE_KEY, type);
    if (user?.id) localStorage.setItem(ASSESSMENT_OWNER_KEY, user.id);
    localStorage.removeItem(ASSESSMENT_PARTIAL_ANSWERS_KEY);
    localStorage.removeItem(ASSESSMENT_OPTIONAL_ANSWERS_KEY);
    localStorage.removeItem(ASSESSMENT_CONTEXT_KEY);
    trackEvent('assessment_started', { is_reevaluation: hasAssessment, assessment_type: type });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      assessment_type: activeType,
    });
  }, [trackEvent, activeType]);

  // Reset question timer when step changes
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentStep]);

  const handleNextStep = () => {
    if (currentStep < activeDomains.length) {
      const currentDomain = activeDomains[currentStep];
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

    try {
      localStorage.setItem(ASSESSMENT_PARTIAL_ANSWERS_KEY, JSON.stringify(watchedValues));
    } catch {
      // Best-effort: sin storage disponible seguimos en memoria
    }
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

  // La persistencia va con debounce: el textarea de contexto dispara un
  // update por tecla y escribir a localStorage en cada una traba el hilo.
  const contextPersistTimeoutRef = useRef<number | null>(null);
  const updateContext = (patch: Partial<AssessmentContext>) => {
    const next = { ...contextValues, ...patch };
    setContextValues(next);
    if (contextPersistTimeoutRef.current !== null) {
      window.clearTimeout(contextPersistTimeoutRef.current);
    }
    contextPersistTimeoutRef.current = window.setTimeout(() => {
      contextPersistTimeoutRef.current = null;
      try {
        localStorage.setItem(ASSESSMENT_CONTEXT_KEY, JSON.stringify(next));
      } catch {
        // Best-effort: sin storage disponible seguimos en memoria
      }
    }, 400);
  };

  const hasContextAnswer = useMemo(() => {
    if (!contextDef) return false;
    if (contextDef.optionsField && contextValues[contextDef.optionsField]) return true;
    if (contextDef.textLabel && contextValues.detalle?.trim()) return true;
    return false;
  }, [contextDef, contextValues]);

  async function onSubmit(data: AnyAssessmentValues) {
    // La validación completa corre acá porque el schema depende del tipo.
    const parsed = getAssessmentSchema(activeType).safeParse(data);
    if (!parsed.success) {
      toast({
        title: "Faltan respuestas",
        description: "Respondé todas las preguntas antes de ver tus resultados.",
        variant: "destructive"
      });
      return;
    }
    const values = parsed.data as AnyAssessmentValues;

    setIsSaving(true);

    try {
      // Solo pasar optionalValues si hay alguna respuesta
      const hasOptionalAnswers = isExperimentado && Object.keys(optionalValues).length > 0;
      const cleanContext: AssessmentContext = {};
      if (contextValues.rolInteres) cleanContext.rolInteres = contextValues.rolInteres;
      if (contextValues.etapa) cleanContext.etapa = contextValues.etapa;
      if (contextValues.detalle?.trim()) cleanContext.detalle = contextValues.detalle.trim();
      const hasContext = Object.keys(cleanContext).length > 0;

      const result = computeSeniorityScore(
        values,
        hasOptionalAnswers ? optionalValues : undefined,
        activeType,
        hasContext ? cleanContext : undefined
      );
      const timeSpent = Math.round((Date.now() - assessmentStartTimeRef.current) / 1000); // segundos

      // Guardar resultado localmente para mostrar inmediatamente
      setLocalResult(result);
      setLocalValues(values);

      // Guardar en servidor (lanza error si falla, para permitir reintento)
      await saveAssessment(values, result, activeType);

      // Invalidar caches para sincronizar con servidor. El composite alimenta
      // useHomeRedirect: sin esto, volver al home tras la primera evaluación
      // puede rebotar de nuevo a /autoevaluacion por el conteo cacheado.
      await queryClient.invalidateQueries({ queryKey: ['assessment-data'] });
      queryClient.invalidateQueries({ queryKey: ['user-composite-data'] });

      // Track assessment completion
      trackEvent('assessment_completed', {
        total_score: result.promedioGlobal,
        estimated_level: result.nivel,
        time_spent_seconds: timeSpent,
        gaps_count: result.gaps?.length || 0,
        strengths_count: result.strengths?.length || 0,
        optional_answered_count: Object.keys(optionalValues).length,
        is_reevaluation: hasAssessment,
        assessment_type: activeType,
        has_context_answer: hasContext,
      });

      // Actualizar propiedades del usuario
      setUserProperties({
        assessment_completed: true,
        estimated_level: result.nivel,
        assessment_type: activeType,
        last_assessment_date: new Date().toISOString()
      });

      const nivelDisplay = getNivelDisplay(activeType, result.nivel);
      toast({
        title: "Evaluación guardada",
        description: `${nivelDisplay.title}: ${nivelDisplay.label} (promedio ${result.promedioGlobal})`
      });

      // Limpiar las flags de evaluación en progreso
      clearProgressStorage();

      // Marcar completado ANTES de cambiar isReevaluating para evitar race condition
      completedThisSessionRef.current = true;

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

  const showSelector = !assessmentLoading && isReevaluating && !selectedType;
  const selectedDomainDef = selectedDomain
    ? activeDomains.find((d) => d.key === selectedDomain) ?? null
    : null;

  // Funnel: quien llega al selector y rebota también cuenta. El evento
  // assessment_started recién se dispara al elegir perfil.
  const selectorViewedRef = useRef(false);
  useEffect(() => {
    if (showSelector) {
      if (!selectorViewedRef.current) {
        selectorViewedRef.current = true;
        trackEvent('assessment_selector_viewed', { has_assessment: hasAssessment });
      }
    } else {
      selectorViewedRef.current = false;
    }
  }, [showSelector, hasAssessment, trackEvent]);

  return (
    <>
      <Seo />
      <section className="container py-6 sm:py-10 px-4 sm:px-6 animate-fade-in">
        {assessmentLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {/* Selector de perfil: lo primero que ve un usuario sin evaluación */}
        {showSelector && (
          <div className="max-w-3xl mx-auto">
            <AssessmentTypeSelector
              onSelect={handleSelectType}
              isReevaluation={hasAssessment}
            />
          </div>
        )}

        {!assessmentLoading && !showSelector && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-semibold">Tu diagnóstico en Producto</h1>
              {hasAssessment && !isReevaluating && (
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
                        Tu resultado anterior se reemplaza por el nuevo, y con él tus Áreas de Mejora. Vas a poder elegir de nuevo tu perfil antes de empezar.
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
                : activeType === 'lider'
                  ? "Elegí la afirmación que mejor describa cómo trabaja hoy tu equipo en cada dominio."
                  : "Elegí la afirmación que mejor describa tu experiencia en cada dominio."}
            </p>
          </>
        )}

        {/* Usar resultado local si existe, sino el del servidor */}
        {!showSelector && (() => {
          const effectiveResult = localResult || savedResult;
          const effectiveValues = localValues || savedValues;
          const effectiveHasAssessment = hasAssessment || !!localResult;

          if (assessmentLoading || !effectiveHasAssessment || isReevaluating || !effectiveResult) {
            return null;
          }

          // Para resultados del servidor manda el hook (mira también la
          // columna de la DB, no solo el JSON, p. ej. tras un backfill).
          const resultType = localResult
            ? (localResult.assessmentType ?? null)
            : savedAssessmentType;
          const resultTypeDef = resultType ? getAssessmentTypeDef(resultType) : null;
          const nivelDisplay = getNivelDisplay(resultType, effectiveResult.nivel);
          const resultDomains = getDomainsForType(resultType ?? 'experimentado');

          return (
          <div className="space-y-6">
            <div className="p-6 rounded-lg border bg-card animate-fade-in hover:shadow-lg transition-all">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold">Tu última evaluación</h2>
                {resultTypeDef && (
                  <Badge variant="outline" className={resultTypeDef.accent.badge}>
                    {resultTypeDef.resultTag}
                  </Badge>
                )}
              </div>

              {/* Promedio destacado en círculo */}
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <div className="relative">
                  <div className="w-36 h-36 rounded-full border-4 border-primary/20 bg-primary/5 flex flex-col items-center justify-center animate-fade-in">
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
                        to={hasActivePremium ? '/mentoria' : (effectiveResult.ctaInfo.route || '/planes')}
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
                    <span className="text-sm text-muted-foreground">{nivelDisplay.title}:</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {nivelDisplay.label}
                    </Badge>
                  </div>

                  {/* Rol de entrada sugerido (solo evaluación sin experiencia) */}
                  {effectiveResult.suggestedRole && (
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Rol de entrada sugerido:</span>
                      <Badge variant="secondary">
                        {effectiveResult.suggestedRole.label}
                      </Badge>
                    </div>
                  )}

                  {/* Especialización */}
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {resultType === 'lider' ? 'Fortaleza del equipo:' : 'Especialización:'}
                    </span>
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
                      <Link to={resultTypeDef ? resultTypeDef.plan.route : "/planes"} className="flex items-center gap-2">
                        <span>Quiero mejorar</span>
                      </Link>
                    </Button>
                  )}
                  <Button
                    asChild
                    size="lg"
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
                  {resultDomains.map((d) => {
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

        {!showSelector && isReevaluating && selectedType && (
          <>
            {/* Barra de progreso sticky unificada */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b shadow-sm p-4 mb-6 -mx-4 sm:rounded-lg sm:border sm:max-w-2xl sm:mx-auto">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-medium">
                    {currentStep < activeDomains.length
                      ? `Pregunta ${currentStep + 1} de ${activeDomains.length}`
                      : isExperimentado
                        ? `Opcional ${currentStep - activeDomains.length + 1} de ${OPTIONAL_DOMAINS.length}`
                        : 'Última pregunta · contexto'
                    }
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-4" />
                {/* Mensaje motivacional (solo durante las preguntas requeridas) */}
                {currentStep < activeDomains.length && getProgressMessage(progress) && (
                  <p className="text-sm font-medium text-primary mt-2 text-center animate-fade-in">
                    {getProgressMessage(progress)}
                  </p>
                )}
                {/* Indicador de pasos */}
                <div className="flex gap-1 mt-3">
                  {activeDomains.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        idx < currentStep ? 'bg-primary' :
                        idx === currentStep ? 'bg-primary/60' :
                        'bg-muted'
                      }`}
                    />
                  ))}
                  {extraSteps > 0 && <div className="w-1" />}
                  {isExperimentado
                    ? OPTIONAL_DOMAINS.map((_, idx) => (
                        <div
                          key={`opt-${idx}`}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            activeDomains.length + idx < currentStep ? 'bg-purple-500' :
                            activeDomains.length + idx === currentStep ? 'bg-purple-400' :
                            'bg-purple-200'
                          }`}
                        />
                      ))
                    : contextDef && (
                        <div
                          key="context"
                          className="h-1.5 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor: activeTypeDef.accent.hex,
                            opacity: currentStep === activeDomains.length ? 0.9 : 0.25
                          }}
                        />
                      )}
                </div>
              </div>
            </div>

            {hasAssessment && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 max-w-2xl mx-auto">
                Estás por actualizar tu evaluación. Al guardar, tus resultados y áreas de mejora se recalcularán automáticamente.
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
                {/* Pregunta actual - siempre una sola card */}
                {currentStep < activeDomains.length && (() => {
                  const d = activeDomains[currentStep];
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
                        name={d.key}
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
                                      <span className="text-sm sm:text-base leading-snug text-left" style={{ textWrap: 'pretty' }}>
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

                {/* Pregunta opcional actual (solo evaluación con experiencia) */}
                {isExperimentado && currentStep >= activeDomains.length && (() => {
                  const optIdx = currentStep - activeDomains.length;
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
                          value={currentOptionalValue !== undefined ? String(currentOptionalValue) : ""}
                          onValueChange={(val) => {
                            const numVal = parseInt(val);
                            const next = { ...optionalValues, [d.key]: numVal };
                            setOptionalValues(next);
                            // Persistir para no perderlas si cierra la pestaña
                            try {
                              localStorage.setItem(ASSESSMENT_OPTIONAL_ANSWERS_KEY, JSON.stringify(next));
                            } catch {
                              // Best-effort: sin storage disponible seguimos en memoria
                            }
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
                                <span className="text-sm sm:text-base leading-snug text-left" style={{ textWrap: 'pretty' }}>
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

                {/* Pregunta de contexto (evaluaciones nuevas): no puntúa, orienta la recomendación */}
                {!isExperimentado && contextDef && currentStep >= activeDomains.length && (
                  <div className="space-y-4 animate-fade-in">
                    <fieldset className="rounded-lg border p-5 sm:p-6 bg-card space-y-4">
                      <legend className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`${activeTypeDef.accent.badge} text-xs`}>
                              Contexto · no afecta tu puntaje
                            </Badge>
                          </div>
                          <p className="font-semibold text-base sm:text-lg leading-snug">
                            {contextDef.question}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{contextDef.helper}</p>
                        </div>
                      </legend>

                      {contextDef.options && contextDef.optionsField && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {contextDef.options.map((option) => {
                            const isSelected = contextValues[contextDef.optionsField!] === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  updateContext({ [contextDef.optionsField!]: option.value } as Partial<AssessmentContext>);
                                }}
                                className={`flex items-center gap-3 rounded-lg border p-3 sm:p-4 cursor-pointer transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                  isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-input hover:bg-muted/40"
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`h-2.5 w-2.5 rounded-full shrink-0 border ${
                                    isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                                  }`}
                                />
                                <span className="text-sm sm:text-base leading-snug">{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {contextDef.textLabel && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{contextDef.textLabel}</p>
                          <Textarea
                            value={contextValues.detalle ?? ""}
                            onChange={(e) => updateContext({ detalle: e.target.value })}
                            placeholder={contextDef.textPlaceholder}
                            rows={3}
                            maxLength={400}
                          />
                        </div>
                      )}
                    </fieldset>
                  </div>
                )}

                {/* Navegación unificada */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  {currentStep === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        // Con respuestas cargadas, cambiar de evaluación las
                        // descarta: pedir confirmación antes de borrarlas.
                        if (answered === 0) {
                          handleStartReevaluation();
                        } else {
                          setShowChangeTypeDialog(true);
                        }
                      }}
                      className="w-full sm:w-auto text-muted-foreground"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Cambiar de evaluación
                    </Button>
                  )}
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
                  {currentStep < activeDomains.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full"
                      disabled={!watchedValues?.[activeDomains[currentStep].key]}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : currentStep === activeDomains.length - 1 ? (
                    extraSteps > 0 ? (
                      <>
                        <Button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full sm:flex-1"
                          disabled={!watchedValues?.[activeDomains[currentStep].key]}
                        >
                          {isExperimentado ? 'Siguiente (Opcionales)' : 'Siguiente (Contexto)'}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button
                          type="submit"
                          variant="outline"
                          className="w-full sm:flex-1"
                          disabled={isSaving || answered < activeDomains.length}
                        >
                          {isSaving ? "Guardando..." : "Ver resultados"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="submit"
                        className="w-full sm:flex-1"
                        disabled={isSaving || answered < activeDomains.length}
                      >
                        {isSaving ? "Guardando..." : "Ver resultados"}
                      </Button>
                    )
                  ) : isExperimentado && currentStep < totalSteps - 1 ? (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSkipOptional}
                        className="w-full sm:flex-1"
                      >
                        Saltar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full sm:flex-1"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ) : isExperimentado ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button
                          type="submit"
                          variant="outline"
                          className="w-full sm:flex-1"
                          disabled={isSaving}
                        >
                          {isSaving ? "Guardando..." : "Saltar y ver resultados"}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            form.handleSubmit(onSubmit)();
                          }}
                          className="w-full sm:flex-1"
                          disabled={isSaving || !optionalValues[OPTIONAL_DOMAINS[currentStep - activeDomains.length]?.key as keyof OptionalAssessmentValues]}
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
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full sm:flex-1"
                        disabled={isSaving}
                      >
                        {isSaving ? "Guardando..." : "Saltar y ver resultados"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          form.handleSubmit(onSubmit)();
                        }}
                        className="w-full sm:flex-1"
                        disabled={isSaving || !hasContextAnswer}
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
                  )}
                </div>
              </form>
            </Form>
          </>
        )}

        <DomainInfoPopup
          domain={selectedDomainDef}
          isOpen={selectedDomain !== null}
          onClose={() => setSelectedDomain(null)}
        />

        <AlertDialog open={showChangeTypeDialog} onOpenChange={setShowChangeTypeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cambiar de evaluación?</AlertDialogTitle>
              <AlertDialogDescription>
                Las respuestas que cargaste hasta acá se descartan y volvés al selector de perfil.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Seguir con esta</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowChangeTypeDialog(false);
                  handleStartReevaluation();
                }}
              >
                Cambiar de evaluación
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </>
  );
}
