import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useUserProgressObjectives } from '@/hooks/useUserProgressObjectives';
import { useMyExercises } from '@/hooks/useUserExercises';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { EditNameDialog } from '@/components/profile/EditNameDialog';
import { Seo } from '@/components/Seo';
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
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const stats = useProfileStats();
  const { data: objectives, isLoading: objectivesLoading } = useUserProgressObjectives(profile?.id || null);
  const { data: exercises, isLoading: exercisesLoading } = useMyExercises();
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);

  const loading = profileLoading || subscriptionLoading;

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
    if (!objective.steps || !Array.isArray(objective.steps)) return 0;
    const completed = objective.steps.filter((step: any) => step.completed).length;
    return (completed / objective.steps.length) * 100;
  };

  const formatNextBillingDate = () => {
    if (!subscription?.current_period_end) return null;
    const date = format(new Date(subscription.current_period_end), "dd/MM/yyyy", { locale: es });
    return `Próximo cobro: ${date} - USD 9,99/mes`;
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
        description="Gestiona tu perfil, revisa tu progreso y mantén el control de tu plan de suscripción"
      />
      
      <div className="container py-8 space-y-6">
        {/* Sección 1: Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {getInitials(profile?.name || null)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{profile?.name || 'Usuario'}</h2>
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
            <div className="flex flex-wrap items-center gap-3">
              <Badge 
                variant={subscription?.plan === 'premium' ? 'default' : 'secondary'}
                className="text-base px-3 py-1"
              >
                {subscription?.plan === 'premium' ? (
                  <>
                    <Crown className="h-4 w-4 mr-1" />
                    Premium
                  </>
                ) : (
                  'Free'
                )}
              </Badge>
              
              {subscription?.status === 'active' && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              )}

              {profile?.mentoria_completed && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Mentoría completada
                </Badge>
              )}
            </div>

            {subscription?.plan === 'premium' && subscription?.status === 'active' && subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                {formatNextBillingDate()}
              </p>
            )}

            {subscription?.plan === 'free' && (
              <Button asChild>
                <Link to="/premium">
                  <Crown className="h-4 w-4 mr-2" />
                  Actualizar a Premium
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sección 3: Estadísticas de Progreso */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Estadísticas de Progreso</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ProfileStats 
              icon={FileText} 
              label="Evaluaciones completadas" 
              value={stats.assessmentsCount} 
            />
            <ProfileStats 
              icon={Target} 
              label="Objetivos activos" 
              value={stats.activeObjectivesCount} 
            />
            <ProfileStats 
              icon={TrendingUp} 
              label="Áreas de mejora" 
              value={stats.gapsCount}
              link="/mejoras"
            />
            <ProfileStats 
              icon={Clock} 
              label="Ejercicios pendientes" 
              value={stats.pendingExercisesCount} 
            />
            <ProfileStats 
              icon={CheckCircle2} 
              label="Ejercicios completados" 
              value={stats.completedExercisesCount} 
            />
            <ProfileStats 
              icon={Calendar} 
              label="Última evaluación" 
              value={stats.lastAssessmentDate} 
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
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tienes objetivos activos
                </p>
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
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tienes ejercicios próximos
                </p>
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
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
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
          setRefetchKey(prev => prev + 1);
          window.location.reload();
        }}
      />
    </>
  );
}
