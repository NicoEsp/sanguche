import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Calendar, Users, CheckCircle2, ArrowRight, Sparkles, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Seo } from '@/components/Seo';

interface Session {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  session_date: string | null;
  max_spots: number | null;
}

const SessionReservation = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { hasActivePremium, loading: subLoading } = useSubscription();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [alreadyReserved, setAlreadyReserved] = useState(false);
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Load session data
  useEffect(() => {
    if (!slug) return;
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('exclusive_sessions')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setSession(data);

      // Count reservations
      const { count } = await supabase
        .from('session_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', data.id);

      setSpotsLeft(data.max_spots ? data.max_spots - (count || 0) : null);
      setLoading(false);
    };
    fetchSession();
  }, [slug]);

  // Check if user already reserved
  useEffect(() => {
    if (!user || !session) return;
    const checkReservation = async () => {
      // Get profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data } = await supabase
        .from('session_reservations')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', profile.id)
        .maybeSingle();

      setAlreadyReserved(!!data);
    };
    checkReservation();
  }, [user, session]);

  // Auto-reserve if returning from auth/planes with intent
  useEffect(() => {
    const intent = searchParams.get('intent');
    if (intent === 'reserve' && user && hasActivePremium && session && !alreadyReserved) {
      handleReserve();
    }
  }, [user, hasActivePremium, session, alreadyReserved, searchParams]);

  const handleReserve = async () => {
    if (!session || !user) return;
    setReserving(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      toast.error('Error al obtener tu perfil');
      setReserving(false);
      return;
    }

    const { error } = await supabase
      .from('session_reservations')
      .insert({ session_id: session.id, user_id: profile.id });

    if (error) {
      if (error.code === '23505') {
        setAlreadyReserved(true);
        toast.info('Ya tenés tu lugar reservado 🎉');
      } else {
        toast.error('No se pudo reservar. ¿Tenés plan Premium activo?');
      }
    } else {
      setAlreadyReserved(true);
      setSpotsLeft(prev => prev !== null ? prev - 1 : null);
      toast.success('¡Lugar reservado con éxito! 🎉');
    }
    setReserving(false);
  };

  const handleGoToAuth = () => {
    navigate(`/auth?redirect=/sesion/${slug}?intent=reserve`);
  };

  const handleGoToPlanes = () => {
    navigate(`/planes?redirect=/sesion/${slug}?intent=reserve`);
  };

  if (loading || authLoading) return <LoadingScreen />;

  if (notFound) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Sesión no encontrada</h1>
          <p className="text-muted-foreground mb-4">Este link no es válido o la sesión ya no está disponible.</p>
          <Button onClick={() => navigate('/')}>Volver al inicio</Button>
        </Card>
      </div>
    );
  }

  if (!session) return null;

  const isFull = spotsLeft !== null && spotsLeft <= 0;

  // Determine current step in funnel
  const step = !user ? 'auth' : subLoading ? 'loading' : !hasActivePremium ? 'upgrade' : alreadyReserved ? 'done' : 'reserve';

  return (
    <>
      <Seo title={`${session.title} | ProductPrepa`} description={session.description || 'Reserva tu lugar en esta sesión exclusiva'} />
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <Card className="max-w-lg w-full p-8 space-y-6">
          {/* Session info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Sesión exclusiva</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{session.title}</h1>
            {session.description && (
              <p className="text-muted-foreground">{session.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {session.session_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(session.session_date), "EEEE d 'de' MMMM, HH:mm 'hs'", { locale: es })}
                </span>
              )}
              {spotsLeft !== null && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {isFull ? 'Sin lugares disponibles' : `${spotsLeft} lugares disponibles`}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Funnel steps */}
          {isFull && !alreadyReserved ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground font-medium">Esta sesión ya está llena 😔</p>
            </div>
          ) : step === 'done' ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-semibold text-foreground">¡Tu lugar está reservado!</p>
              <p className="text-sm text-muted-foreground">Te avisaremos con los detalles de la sesión.</p>
            </div>
          ) : step === 'auth' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Creá tu cuenta</p>
                  <p className="text-sm text-muted-foreground">Registrate gratis para empezar.</p>
                </div>
              </div>
              <Button onClick={handleGoToAuth} className="w-full" size="lg">
                Registrarme <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : step === 'loading' ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : step === 'upgrade' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Sesión exclusiva para Premium</p>
                  <p className="text-sm text-muted-foreground">Suscribite al plan Premium para reservar tu lugar.</p>
                </div>
              </div>
              <Button onClick={handleGoToPlanes} className="w-full" size="lg">
                Ver planes Premium <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={handleReserve} className="w-full" size="lg" disabled={reserving}>
                {reserving ? 'Reservando...' : 'Reservar mi lugar'} 
                {!reserving && <CheckCircle2 className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default SessionReservation;
