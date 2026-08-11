import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Calendar, Users, CheckCircle2, ArrowRight, Sparkles, Lock, Target, BookOpen, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Seo } from '@/components/Seo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';

interface Session {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  session_date: string | null;
  max_spots: number | null;
  agenda: unknown;
  speaker_name: string | null;
  speaker_bio: string | null;
  speaker_image_url: string | null;
  target_audience: string | null;
  learning_outcomes: string | null;
}

const SessionReservation = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { hasActivePremium, loading: subLoading } = useSubscription();
  const { trackEvent } = useMixpanelTracking();

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

      setSession(data as Session);

      const { data: spots } = await supabase
        .rpc('get_session_spots_left', { p_session_id: data.id });

      setSpotsLeft(spots ?? data.max_spots);
      setLoading(false);
    };
    fetchSession();
  }, [slug]);

  // Check if user already reserved
  useEffect(() => {
    if (!user || !session) return;
    const checkReservation = async () => {
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
      handleReserve('auto_intent');
    }
  }, [user, hasActivePremium, session, alreadyReserved, searchParams]);

  // Navegación de salida: siempre queda registrado desde qué estado se sale.
  const goTo = (destination: string, ctaLocation: string) => {
    trackEvent('sesion_reserva_cta_clicked', {
      cta_location: ctaLocation,
      destination,
      session_slug: slug,
    });
    navigate(destination);
  };

  const handleReserve = async (source: 'cta' | 'auto_intent' = 'cta') => {
    if (!session || !user) return;
    setReserving(true);

    trackEvent('sesion_reserva_iniciada', {
      session_slug: session.slug,
      source,
      spots_left: spotsLeft,
    });

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
        trackEvent('sesion_reserva_fallida', {
          session_slug: session.slug,
          source,
        });
        toast.error('No se pudo reservar. ¿Tenés plan Premium activo?');
      }
    } else {
      setAlreadyReserved(true);
      setSpotsLeft(prev => prev !== null ? prev - 1 : null);
      trackEvent('sesion_reserva_completada', {
        session_slug: session.slug,
        source,
      });
      toast.success('¡Lugar reservado con éxito! 🎉');
    }
    setReserving(false);
  };

  const handleGoToAuth = () => {
    trackEvent('sesion_reserva_cta_clicked', {
      cta_location: 'sesion_paso_auth',
      destination: '/auth',
      session_slug: slug,
    });
    navigate(`/auth?redirect=/sesion/${slug}?intent=reserve`);
  };

  const handleGoToPlanes = () => {
    trackEvent('sesion_reserva_cta_clicked', {
      cta_location: 'sesion_paso_upgrade',
      destination: '/planes',
      session_slug: slug,
    });
    navigate(`/planes?redirect=/sesion/${slug}?intent=reserve`);
  };

  if (loading || authLoading) return <LoadingScreen />;

  if (notFound) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-2">Sesión no encontrada</h1>
          <p className="text-muted-foreground mb-4">
            Este link no es válido o la sesión ya no está disponible. Mirá los planes: las próximas sesiones
            exclusivas salen para quienes tienen un plan activo.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => goTo('/planes', 'sesion_no_encontrada')}>
              Ver planes <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => goTo('/', 'sesion_no_encontrada')}>
              Volver al inicio
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!session) return null;

  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const step = !user ? 'auth' : subLoading ? 'loading' : !hasActivePremium ? 'upgrade' : alreadyReserved ? 'done' : 'reserve';

  const agendaItems = Array.isArray(session.agenda) ? session.agenda as string[] : [];
  const hasSpeaker = session.speaker_name;
  const hasAudience = session.target_audience;
  const hasOutcomes = session.learning_outcomes;
  const hasExtraInfo = agendaItems.length > 0 || hasSpeaker || hasAudience || hasOutcomes;

  return (
    <>
      <Seo title={`${session.title} | ProductPrepa`} description={session.description || 'Reserva tu lugar en esta sesión exclusiva'} />
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-6">
          {/* Main card */}
          <Card className="overflow-hidden">
            {/* Header banner */}
            <div className="bg-primary/10 px-8 py-6 border-b border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Evento exclusivo</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{session.title}</h1>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Event details */}
              <div className="space-y-3">
                {session.session_date && (
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg p-2.5 shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(session.session_date), "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.session_date), "h:mm a")} (Argentina)
                      </p>
                    </div>
                  </div>
                )}
                {spotsLeft !== null && (
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg p-2.5 shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isFull ? 'Sin lugares disponibles' : `${spotsLeft} lugares disponibles`}
                      </p>
                      <p className="text-sm text-muted-foreground">Cupos limitados</p>
                    </div>
                  </div>
                )}
              </div>

              {session.description && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{session.description}</p>
              )}

              <div className="border-t border-border" />

              {/* Funnel steps */}
              {isFull && !alreadyReserved ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-muted-foreground font-medium">Esta sesión ya está llena 😔</p>
                  <p className="text-sm text-muted-foreground">
                    Con un plan activo entrás primero a las próximas sesiones exclusivas.
                  </p>
                  <Button onClick={() => goTo('/planes', 'sesion_llena')} className="w-full" size="lg">
                    Ver planes <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : step === 'done' ? (
                <div className="text-center py-4 space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                  <p className="text-lg font-semibold text-foreground">¡Tu lugar está reservado!</p>
                  <p className="text-sm text-muted-foreground">Te avisaremos con los detalles de la sesión.</p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button onClick={() => goTo('/mentoria', 'sesion_reservada')} className="w-full" size="lg">
                      Ir a mentoría <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => goTo('/progreso', 'sesion_reservada')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      Ver mi progreso
                    </Button>
                  </div>
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
                  <Button onClick={() => handleReserve('cta')} className="w-full" size="lg" disabled={reserving}>
                    {reserving ? 'Reservando...' : 'Reservar mi lugar'} 
                    {!reserving && <CheckCircle2 className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Extra info sections */}
          {hasExtraInfo && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Speaker */}
              {hasSpeaker && (
                <Card className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <User className="h-4 w-4 text-primary" />
                    Speaker
                  </div>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={session.speaker_image_url || undefined} alt={session.speaker_name || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {session.speaker_name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{session.speaker_name}</p>
                      {session.speaker_bio && (
                        <p className="text-sm text-muted-foreground mt-0.5">{session.speaker_bio}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Target audience */}
              {hasAudience && (
                <Card className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Target className="h-4 w-4 text-primary" />
                    ¿Para quién es?
                  </div>
                  <p className="text-sm text-muted-foreground">{session.target_audience}</p>
                </Card>
              )}

              {/* Agenda */}
              {agendaItems.length > 0 && (
                <Card className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Agenda
                  </div>
                  <ul className="space-y-2">
                    {agendaItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="bg-primary/10 text-primary font-semibold rounded-full h-5 w-5 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {String(item)}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Learning outcomes */}
              {hasOutcomes && (
                <Card className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Qué vas a aprender
                  </div>
                  <p className="text-sm text-muted-foreground">{session.learning_outcomes}</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SessionReservation;
