import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCompositeData } from '@/hooks/useProfileCompositeData';
import { usePricing } from '@/hooks/usePricing';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getPlanBadgeInfo } from '@/constants/plans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EditNameDialog } from '@/components/profile/EditNameDialog';
import { Seo } from '@/components/Seo';
import { LemonSqueezyCheckout } from '@/components/LemonSqueezyCheckout';
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
import { CheckCircle, CheckCircle2, Crown, Edit2, Loader2, Mail, RefreshCw, ShoppingBag, Star, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CONTACT_EMAIL = 'nicoproducto@hey.com';

const EXTERNAL_PLAN_LABELS: Record<string, string> = {
  productprepa_business: 'ProductPrepa for Business',
  productastic_review: 'Productastic Review',
};

const getInitials = (name: string | null) => {
  if (!name) return 'U';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: compositeData, loading } = useProfileCompositeData();
  const { profile, subscription } = compositeData;
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const { toast } = useToast();
  const pricing = usePricing();

  const plan = subscription?.plan ?? 'free';
  const status = subscription?.status;
  const isActive = status === 'active';
  const isFree = plan === 'free';
  const isComped = subscription?.isComped ?? false;
  const isOneTime = subscription?.isOneTimePurchase ?? false;
  const externalPlanLabel = EXTERNAL_PLAN_LABELS[plan];
  const badgeInfo = getPlanBadgeInfo(plan);

  const invalidateProfile = () => {
    queryClient.invalidateQueries({ queryKey: ['user-composite-data', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');

      const { error } = await supabase.functions.invoke('cancel-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;

      toast({
        title: 'Suscripción cancelada',
        description: 'Seguirás teniendo acceso hasta el fin del período actual.',
      });
      invalidateProfile();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error canceling subscription:', error);
      toast({
        title: 'Error al cancelar',
        description: 'No pudimos cancelar tu suscripción. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const periodEnd = subscription?.current_period_end
    ? format(subscription.current_period_end, 'dd/MM/yyyy', { locale: es })
    : null;

  const planPrice: Partial<Record<string, string>> = {
    premium: pricing.premium.formatted,
    repremium: pricing.repremium.formatted,
  };

  const getUpgradeOptions = () => {
    if (!isActive) return null;
    if (plan === 'premium') {
      return {
        title: 'Mejorar tu plan',
        description: 'Obtené 2 sesiones mensuales 1:1 y acceso completo a todos los cursos con RePremium.',
        options: [{ plan: 'repremium' as const, label: 'Upgrade a RePremium' }],
      };
    }
    if (plan === 'curso_estrategia') {
      return {
        title: 'Mejorar tu acceso',
        description: 'Expandí tu acceso a más cursos o sumá mentoría personalizada.',
        options: [
          { plan: 'cursos_all' as const, label: 'Todos los Cursos' },
          { plan: 'repremium' as const, label: 'RePremium' },
        ],
      };
    }
    if (plan === 'cursos_all') {
      return {
        title: 'Sumá mentoría',
        description: 'Upgrade a RePremium incluye 2 sesiones mensuales 1:1.',
        options: [{ plan: 'repremium' as const, label: 'Upgrade a RePremium' }],
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const seo = (
    <Seo
      title="Mi Perfil - ProductPrepa"
      description="Gestiona tu cuenta y tu plan de suscripción"
      canonical="/perfil"
      keywords="perfil usuario, configuración cuenta, suscripción Product Builder"
    />
  );

  if (externalPlanLabel) {
    return (
      <>
        {seo}
        <div className="container py-8 sm:py-12 px-4 sm:px-6">
          <Card className="max-w-xl mx-auto">
            <CardContent className="pt-6 space-y-4">
              <Badge variant={badgeInfo.variant} className={badgeInfo.className}>
                {externalPlanLabel}
              </Badge>
              <p className="text-muted-foreground">
                Tu cuenta <span className="font-medium text-foreground">{user?.email}</span> tiene acceso a través de {externalPlanLabel}.
              </p>
              <p className="text-sm text-muted-foreground">
                Por cualquier consulta escribime a{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline text-foreground">{CONTACT_EMAIL}</a>.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const upgradeInfo = getUpgradeOptions();
  const showCancel = isActive && !isFree && !isOneTime && !isComped;
  const showViewPlans = isFree || !isActive;

  return (
    <>
      {seo}
      <div className="container py-8 sm:py-12 px-4 sm:px-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
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
                <Button variant="ghost" size="sm" onClick={() => setEditNameOpen(true)} aria-label="Editar nombre">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap gap-2">
                {profile?.is_founder && (
                  <Badge variant="founder">
                    <Star className="h-3 w-3 mr-1" />
                    Founder
                  </Badge>
                )}
                {profile?.mentoria_completed && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Mentoría completada
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={badgeInfo.variant} className={`text-base px-3 py-1 ${badgeInfo.className}`}>
                {badgeInfo.label}
              </Badge>

              {!isFree && isActive && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              )}

              {!isFree && status === 'cancelled' && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancelado
                </Badge>
              )}

              {!isFree && isActive && !isComped && (
                <Badge
                  variant="outline"
                  className={isOneTime
                    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'}
                >
                  {isOneTime ? <ShoppingBag className="h-3 w-3 mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  {isOneTime ? 'Compra única' : 'Suscripción mensual'}
                </Badge>
              )}

              {isComped && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  Bonificado
                </Badge>
              )}
            </div>

            {!isFree && isActive && !isComped && (
              <p className="text-sm text-muted-foreground">
                {isOneTime
                  ? 'Acceso permanente'
                  : periodEnd
                    ? `Próximo cobro: ${periodEnd}${planPrice[plan] ? ` - ${planPrice[plan]}/mes` : ''}`
                    : null}
              </p>
            )}

            {!isFree && status === 'cancelled' && periodEnd && (
              <p className="text-sm text-muted-foreground">Tenés acceso hasta el {periodEnd}.</p>
            )}

            {isComped && (
              <p className="text-sm text-muted-foreground">
                Tu plan fue bonificado. Por cualquier consulta escribime a{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline text-foreground inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {CONTACT_EMAIL}
                </a>.
              </p>
            )}

            {upgradeInfo && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 space-y-3">
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
            )}

            {showCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar suscripción
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar tu suscripción?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-2">
                        <p>Al cancelar tu suscripción:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Perderás acceso a recursos dedicados y ejercicios personalizados</li>
                          <li>No podrás acceder a la mentoría personalizada</li>
                          <li>Seguirás teniendo acceso hasta el fin de tu período actual</li>
                        </ul>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mantener plan</AlertDialogCancel>
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

            {showViewPlans && (
              <Button asChild>
                <Link to="/planes">
                  <Crown className="h-4 w-4 mr-2" />
                  Ver planes
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <EditNameDialog
        open={editNameOpen}
        onOpenChange={setEditNameOpen}
        currentName={profile?.name || null}
        profileId={profile?.id || ''}
        onSuccess={invalidateProfile}
      />
    </>
  );
}
