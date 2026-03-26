import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCompositeData } from '@/hooks/useProfileCompositeData';
import { useUserProgressObjectives } from '@/hooks/useUserProgressObjectives';
import { useMyExercises } from '@/hooks/useUserExercises';
import { useAssessmentData } from '@/hooks/useAssessmentData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { EditNameDialog } from '@/components/profile/EditNameDialog';
import { ShareFounderBadge } from '@/components/profile/ShareFounderBadge';
import { Seo } from '@/components/Seo';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LemonSqueezyCheckout } from '@/components/LemonSqueezyCheckout';
import { 
  FileText, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Edit2,
  LogOut,
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
  Star,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePricing } from '@/hooks/usePricing';

export default function Profile() {
  const { user, signOut, isSigningOut } = useAuth();
  const { data: compositeData, loading } = useProfileCompositeData();
  const { profile, subscription, assessmentsCount, lastAssessmentDate } = compositeData;
  const { result } = useAssessmentData();
  const { data: objectives, isLoading: objectivesLoading } = useUserProgressObjectives(profile?.id || null);
  const { data: exercises, isLoading: exercisesLoading } = useMyExercises();
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const { toast } = useToast();
  const pricing = usePricing();

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      const { error } = await supabase.functions.invoke('cancel-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción ha sido cancelada. Seguirás teniendo acceso hasta el fin del período actual.",
      });

      window.location.reload();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('Error canceling subscription:', error);
      }
      toast({
        title: "Error al cancelar",
        description: "No pudimos cancelar tu suscripción. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const activeObjectives = objectives?.filter(o => o.status !== 'completed').slice(0, 5) || [];
  const upcomingExercises = exercises
    ?.filter(e => e.due_date && new Date(e.due_date) > new Date() && e.status !== 'reviewed')
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5) || [];

  const getObjectiveProgress = (objective: any) => {
    if (!objective.steps || !Array.isArray(objective.steps) || objective.steps.length === 0) return 0;
    const completed = objective.steps.filter((step: any) => step.completed).length;
    return (completed / objective.steps.length) * 100;
  };

  const formatNextBillingDate = () => {
    if (!subscription?.current_period_end) return null;
    const date = format(new Date(subscription.current_period_end), "dd/MM/yyyy", { locale: es });
    const plan = subscription?.plan;
    const priceMap: Record<string, string> = {
      premium: pricing.premium.formatted,
      repremium: pricing.repremium.formatted,
      curso_estrategia: pricing.curso_estrategia.formatted,
      cursos_all: pricing.cursos_all.formatted,
    };
    const price = plan ? priceMap[plan] || '' : '';
    return `Próximo cobro: ${date}${price ? ` - ${price}/mes` : ''}`;
  };

  const formatLastAssessmentDate = () => {
    if (!lastAssessmentDate) return 'Sin evaluación';
    return format(new Date(lastAssessmentDate), 'dd/MM/yyyy', { locale: es });
  };

  // Calculate stats from composite data
  const activeObjectivesCount = objectives?.filter(o => o.status !== 'completed').length || 0;
  const gapsCount = result?.gaps?.length || 0;
  const pendingExercisesCount = exercises?.filter(e => 
    ['assigned', 'in_progress'].includes(e.status || '')
  ).length || 0;
  const completedExercisesCount = exercises?.filter(e => 
    ['submitted', 'reviewed'].includes(e.status || '')
  ).length || 0;

  // Helper to get plan badge
  const getPlanBadge = () => {
    const plan = subscription?.plan;
    
    if (plan === 'repremium') {
      return (
        <Badge variant="repremium" className="text-base px-3 py-1">
          <Sparkles className="h-4 w-4 mr-1" />
          RePremium
        </Badge>
      );
    }
    
    if (plan === 'cursos_all') {
      return (
        <Badge variant="cursosAll" className="text-base px-3 py-1">
          <GraduationCap className="h-4 w-4 mr-1" />
          Acceso a todos los Cursos
        </Badge>
      );
    }
    
    if (plan === 'premium' || plan === 'curso_estrategia') {
      return (
        <Badge variant="default" className="text-base px-3 py-1">
          <Crown className="h-4 w-4 mr-1" />
          Premium
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="text-base px-3 py-1">
        Free
      </Badge>
    );
  };

  // Check if user has any "other badges"
  const hasOtherBadges = profile?.is_founder;

  // Helper to get upgrade options based on current plan
  const getUpgradeOptions = () => {
    const plan = subscription?.plan;
    const isActive = subscription?.status === 'active';
    
    if (!isActive || plan === 'repremium' || plan === 'free') return null;
    
    if (plan === 'premium') {
      return {
        title: "Mejorar tu plan",
        description: "Obtené 2 sesiones mensuales 1:1 y acceso completo a todos los cursos con RePremium.",
        options: [{ plan: 'repremium' as const, label: 'Upgrade a RePremium' }]
      };
    }
    
    if (plan === 'curso_estrategia') {
      return {
        title: "Mejorar tu acceso",
        description: "Expandí tu acceso a más cursos o sumá mentoría personalizada.",
        options: [
          { plan: 'cursos_all' as const, label: 'Todos los Cursos' },
          { plan: 'repremium' as const, label: 'RePremium' }
        ]
      };
    }
    
    if (plan === 'cursos_all') {
      return {
        title: "Sumá mentoría",
        description: "¿Querés acompañamiento personalizado? Upgrade a RePremium incluye 2 sesiones mensuales 1:1.",
        options: [{ plan: 'repremium' as const, label: 'Upgrade a RePremium' }]
      };
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo 
        title="Mi Perfil - ProductPrepa"
        description="Gestiona tu perfil, revisa tu Career Path y mantén el control de tu plan de suscripción"
        canonical="/perfil"
        keywords="perfil usuario, configuración cuenta, suscripción Product Builder"
      />
      
      <div className="container py-8 sm:py-12 px-4 sm:px-6 space-y-6">
        {/* Sección 1: Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
              <AvatarFallback className="text-xl sm:text-2xl bg-primary/10 text-primary">
                {getInitials(profile?.name || null)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold truncate">{profile?.name || 'Usuario'}</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditNameOpen(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Plan y Suscripción */}
        <Card>
          <CardHeader>
            <CardTitle>Plan y Suscripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary badges row: Plan + Status chips */}
            <div className="flex flex-wrap items-center gap-3">
              {getPlanBadge()}

              {subscription?.status === 'active' && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              )}

              {subscription?.status === 'active' && ['premium', 'repremium', 'curso_estrategia', 'cursos_all'].includes(subscription?.plan || '') && (
                <Badge 
                  variant="outline" 
                  className={subscription.isOneTimePurchase 
                    ? "bg-purple-500/10 text-purple-700 dark:text-purple-400" 
                    : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  }
                >
                  {subscription.isOneTimePurchase ? (
                    <>
                      <ShoppingBag className="h-3 w-3 mr-1" />
                      Compra única
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Suscripción mensual
                    </>
                  )}
                </Badge>
              )}

              {profile?.mentoria_completed && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mentoría completada
                </Badge>
              )}
            </div>

            {/* Other badges section */}
            {hasOtherBadges && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">Otras badges obtenidas</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {profile?.is_founder && <ShareFounderBadge />}
                  </div>
                </div>
              </>
            )}

            {subscription?.plan !== 'free' && subscription?.status === 'active' && (
              <p className="text-sm text-muted-foreground">
                {subscription.isOneTimePurchase 
                  ? "Acceso permanente" 
                  : formatNextBillingDate()
                }
              </p>
            )}

            {/* Upgrade Section */}
            {(() => {
              const upgradeInfo = getUpgradeOptions();
              if (!upgradeInfo) return null;
              
              return (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-medium text-amber-900 dark:text-amber-100">{upgradeInfo.title}</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{upgradeInfo.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {upgradeInfo.options.map((option) => (
                          <LemonSqueezyCheckout 
                            key={option.plan}
                            plan={option.plan} 
                            buttonText={option.label}
                            variant="default"
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {subscription?.plan !== 'free' && subscription?.status === 'active' && !subscription?.isOneTimePurchase && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar suscripción
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar tu suscripción Premium?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2">
                        <p>Al cancelar tu suscripción:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Perderás acceso a recursos dedicados y ejercicios personalizados</li>
                          <li>No podrás acceder a la mentoría personalizada</li>
                          <li>Seguirás teniendo acceso hasta el fin de tu período actual</li>
                        </ul>
                        <p className="font-medium mt-4">¿Estás seguro de que deseas continuar?</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mantener Premium</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isCanceling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Cancelando...
                        </>
                      ) : (
                        'Sí, cancelar suscripción'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {subscription?.plan === 'free' && (
              <Button asChild>
                <Link to="/planes">
                  <Crown className="h-4 w-4 mr-2" />
                  Ver planes
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sección 3: Estadísticas de Career Path */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">Estadísticas de Career Path</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ProfileStats 
              icon={FileText} 
              label="Evaluaciones completadas" 
              value={assessmentsCount} 
            />
            <ProfileStats 
              icon={Target} 
              label="Objetivos activos" 
              value={activeObjectivesCount} 
            />
            <ProfileStats 
              icon={TrendingUp} 
              label="Áreas de mejora" 
              value={gapsCount}
              link="/mejoras"
            />
            <ProfileStats 
              icon={Clock} 
              label="Ejercicios pendientes" 
              value={pendingExercisesCount} 
            />
            <ProfileStats 
              icon={CheckCircle2} 
              label="Ejercicios completados" 
              value={completedExercisesCount} 
            />
            <ProfileStats 
              icon={Calendar} 
              label="Última evaluación" 
              value={formatLastAssessmentDate()} 
            />
          </div>
        </div>

        {/* Sección 4: Progreso Reciente */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Objetivos activos */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos Activos</CardTitle>
              <CardDescription>Tu progreso en objetivos recientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {objectivesLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))
              ) : activeObjectives.length > 0 ? (
                activeObjectives.map((objective) => {
                  const progress = getObjectiveProgress(objective);
                  return (
                    <div key={objective.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{objective.title}</span>
                        <span className="text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <Target className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No tienes objetivos activos</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos ejercicios */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Ejercicios</CardTitle>
              <CardDescription>Ejercicios con fecha límite próxima</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {exercisesLoading ? (
                [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))
              ) : upcomingExercises.length > 0 ? (
                upcomingExercises.map((exercise) => {
                  const daysUntilDue = Math.ceil(
                    (new Date(exercise.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isUrgent = daysUntilDue <= 3;
                  
                  return (
                    <div key={exercise.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{exercise.exercise_title}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence: {format(new Date(exercise.due_date!), "dd/MM/yyyy", { locale: es })}
                        </p>
                      </div>
                      {isUrgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgente
                        </Badge>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                  <Clock className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No tienes ejercicios próximos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sección 5: Configuración de Cuenta */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => signOut()}
              className="w-full sm:w-auto"
              disabled={isSigningOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isSigningOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <EditNameDialog
        open={editNameOpen}
        onOpenChange={setEditNameOpen}
        currentName={profile?.name || null}
        profileId={profile?.id || ''}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
}
