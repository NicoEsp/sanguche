import { createContext, useCallback, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useServerAdminValidation } from '@/hooks/useServerAdminValidation';
import { Mixpanel } from '@/lib/mixpanel';
import { useQueryClient } from '@tanstack/react-query';
import { fetchCompositeData } from '@/hooks/useProfileCompositeData';
import { getAuthErrorMessage } from '@/utils/errorMessages';

type AuthResult = { error: AuthError | Error | null };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  /** Solo la restauración inicial de la sesión. No cambia durante un login. */
  isLoading: boolean;
  /** Hay una acción de auth en curso (login, registro, reenvío, cambio de contraseña). */
  isSubmitting: boolean;
  isSigningOut: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** El RPC is_admin_jwt todavía no respondió para el usuario actual. */
  isAdminLoading: boolean;
  signUp: (email: string, password: string, name?: string, returnTo?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: (returnTo?: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Fast path: check if there's a Supabase auth token in localStorage.
 * If not, the user is almost certainly unauthenticated and we can skip
 * the loading spinner entirely.
 */
function hasAuthTokenInStorage(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        return true;
      }
    }
  } catch {
    // localStorage may not be available (private browsing, etc.)
  }
  return false;
}

/**
 * Usuarios a los que ya se les corrió ensure_user_defaults en esta carga.
 * onAuthStateChange dispara con cada TOKEN_REFRESHED y USER_UPDATED, y el RPC
 * hace un UPDATE sobre profiles aunque no cambie nada: ese UPDATE llega por
 * realtime e invalida el perfil y los datos compuestos, que se vuelven a pedir.
 */
const ensuredDefaultsFor = new Set<string>();

interface AuthProviderProps {
  children: ReactNode;
  /**
   * Sesión ya resuelta antes del primer render (main.tsx la espera cuando hay
   * HTML prerenderizado). Con ella no hace falta el spinner de carga: el primer
   * render ya sabe si hay usuario.
   */
  initialSession?: Session | null;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => initialSession?.user ?? null);
  const [session, setSession] = useState<Session | null>(() => initialSession ?? null);
  // Fast path: if no token in localStorage, skip loading state entirely
  const [isLoading, setIsLoading] = useState(() =>
    initialSession === undefined ? hasAuthTokenInStorage() : false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const queryClient = useQueryClient();

  // SECURITY: Server-side admin validation - cannot be bypassed by localStorage manipulation.
  // No bloquea el resto de la app: solo /admin espera a isAdminLoading.
  const { isAdmin, isValidating: isAdminLoading } = useServerAdminValidation(user);

  const userId = user?.id;

  // Un solo canal con los tres listeners, atado al id y no al objeto user: el
  // objeto cambia con cada refresh del token y antes eso cerraba y reabría los
  // canales. El profile.id sale de los datos compuestos, que el bootstrap ya
  // está trayendo, en vez de una query propia.
  useEffect(() => {
    if (!userId) return;

    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const invalidate = (...keys: string[]) => {
      keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key, userId] }));
    };

    const setupRealtimeSync = async () => {
      let profileId: string | undefined;
      try {
        const composite = await queryClient.fetchQuery({
          queryKey: ['user-composite-data', userId],
          queryFn: () => fetchCompositeData(userId),
        });
        profileId = composite.profile?.id;
      } catch {
        // Sin profile.id igual escuchamos profiles, que se filtra por user_id.
      }

      if (!active) return;

      channel = supabase
        .channel(`auth-sync-${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` },
          () => invalidate('user-profile', 'user-composite-data')
        );

      if (profileId) {
        channel = channel
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'user_subscriptions', filter: `user_id=eq.${profileId}` },
            () => invalidate('subscription', 'user-composite-data')
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'assessments', filter: `user_id=eq.${profileId}` },
            () => invalidate('assessment-data', 'assessment-data-check', 'user-composite-data')
          );
      }

      channel.subscribe();
    };

    setupRealtimeSync();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  useEffect(() => {
    // Safety timeout: if auth takes too long, unblock the UI
    const safetyTimeout = setTimeout(() => {
      setIsLoading((current) => {
        if (current) {
          console.warn('[AuthContext] Auth initialization timed out, unblocking UI');
          return false;
        }
        return current;
      });
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsLoading(false);

        // Detectar flujo de recovery - emitir evento para que Auth.tsx pueda procesar
        if (event === 'PASSWORD_RECOVERY') {
          window.dispatchEvent(new CustomEvent('supabase:password_recovery'));
        }

        // Bootstrap, una vez por usuario y carga: asegurar datos base + prefetch en paralelo
        if (currentUser && !ensuredDefaultsFor.has(currentUser.id)) {
          ensuredDefaultsFor.add(currentUser.id);
          Promise.allSettled([
            supabase.rpc('ensure_user_defaults'),
            queryClient.prefetchQuery({
              queryKey: ['user-composite-data', currentUser.id],
              queryFn: () => fetchCompositeData(currentUser.id),
            }),
          ]);
        }

        // Track OAuth completion (Google). Email auth is tracked in Auth.tsx handlers.
        // Gate on a sessionStorage flag set in signInWithGoogle so we only fire
        // once per real OAuth flow — not on every SIGNED_IN from session restore
        // or cross-tab sync.
        if (event === 'SIGNED_IN' && currentUser) {
          const provider = currentUser.app_metadata?.provider;
          if (provider === 'google' && sessionStorage.getItem('google_oauth_pending') === '1') {
            sessionStorage.removeItem('google_oauth_pending');
            const createdAt = new Date(currentUser.created_at).getTime();
            const lastSignInRaw = currentUser.last_sign_in_at ?? currentUser.created_at;
            const lastSignInAt = new Date(lastSignInRaw).getTime();
            const isNewSignup = Math.abs(lastSignInAt - createdAt) < 60_000;
            const fullName =
              (currentUser.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ??
              (currentUser.user_metadata as { full_name?: string; name?: string } | undefined)?.name;

            Mixpanel.identify(currentUser.id);
            Mixpanel.people.set({
              $email: currentUser.email,
              $name: fullName,
              signup_provider: provider,
              signup_date: currentUser.created_at,
            });

            Mixpanel.track('google_signin_completed', {
              email: currentUser.email,
              is_new_signup: isNewSignup,
            });

            if (isNewSignup) {
              Mixpanel.track('signup_started', {
                method: 'google',
                email: currentUser.email,
              });
              Mixpanel.track('signup_completed', {
                method: 'google',
                email: currentUser.email,
                name: fullName,
              });
            } else {
              Mixpanel.track('login_started', {
                method: 'google',
                email: currentUser.email,
              });
              Mixpanel.track('login_completed', {
                method: 'google',
                email: currentUser.email,
              });
            }
          }
        }

        if (event === 'SIGNED_OUT') {
          ensuredDefaultsFor.clear();
          toast({
            title: "Sesión cerrada",
            description: "Has cerrado sesión correctamente.",
          });
        }
      }
    );

    // Respaldo por si INITIAL_SESSION no llegara: onAuthStateChange ya hace el bootstrap.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // isSubmitting y no isLoading: con isLoading en true y sin sesión, AuthProvider
  // renderiza el spinner en lugar de la app, así que un login fallido desmontaba
  // /auth y la devolvía en modo registro con el formulario vacío.
  const signUp = useCallback(async (email: string, password: string, name?: string, returnTo?: string) => {
    setIsSubmitting(true);
    try {
      // Incluir returnTo en el redirect URL si existe
      let redirectUrl = `${window.location.origin}/?new_user=true`;
      if (returnTo) {
        redirectUrl += `&returnTo=${encodeURIComponent(returnTo)}`;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: name ? { name } : undefined
        }
      });

      if (error) {
        toast({
          title: "Error al registrarse",
          description: getAuthErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registro exitoso",
          description: "Por favor verifica tu email antes de iniciar sesión.",
        });
      }

      return { error };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: getAuthErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });
      }

      return { error };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async (returnTo?: string) => {
    try {
      // Incluir returnTo en el redirect URL si existe
      let redirectUrl = window.location.origin;
      if (returnTo) {
        redirectUrl += `?returnTo=${encodeURIComponent(returnTo)}`;
      }

      sessionStorage.setItem('google_oauth_pending', '1');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        sessionStorage.removeItem('google_oauth_pending');
        Mixpanel.track('google_signin_failed', { error: error.message });
        toast({
          title: "Error con Google",
          description: "No se pudo iniciar sesión con Google. Intenta nuevamente.",
          variant: "destructive",
        });
      }

      return { error };
    } catch (error) {
      sessionStorage.removeItem('google_oauth_pending');
      Mixpanel.track('google_signin_failed', { error: error instanceof Error ? error.message : 'unknown' });
      return { error: error instanceof Error ? error : new Error('unknown') };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isSigningOut) {
      return { error: null };
    }

    setIsSigningOut(true);
    try {
      Mixpanel.track('user_logout');
      Mixpanel.reset();
      const { error } = await supabase.auth.signOut();

      if (!error) {
        queryClient.clear();
      }

      return { error };
    } finally {
      setIsSigningOut(false);
    }
  }, [isSigningOut, queryClient]);

  const resetPassword = useCallback(async (email: string) => {
    setIsSubmitting(true);
    try {
      // Goes through our own function (Resend + a link on productprepa.com)
      // instead of supabase.auth.resetPasswordForEmail(), whose mails leave
      // from noreply@mail.app.supabase.io: rate-capped project-wide and
      // regularly dropped or spam-foldered by Outlook/Hotmail.
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: email.trim().toLowerCase() },
      });

      if (error) {
        const isRateLimit = (error as { context?: { status?: number } })?.context?.status === 429;
        toast({
          title: "Error al enviar email",
          description: isRateLimit
            ? "Ya pediste varios enlaces seguidos. Esperá unos minutos e intentá de nuevo."
            : "No pudimos enviar el email. Intentá de nuevo en unos minutos o escribinos a hola@productprepa.com.",
          variant: "destructive",
        });
        return { error };
      }

      // Deliberately the same message whether or not the address has an
      // account, so the form can't be used to check who is registered.
      toast({
        title: "Email enviado",
        description: "Si el email está registrado, vas a recibir el enlace en unos minutos. Revisá también spam o correo no deseado.",
      });

      return { error: null };
    } catch (error) {
      toast({
        title: "Error al enviar email",
        description: "No pudimos enviar el email. Intentá de nuevo en unos minutos.",
        variant: "destructive",
      });
      return { error: error instanceof Error ? error : new Error('unknown') };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Error al actualizar contraseña",
          description: getAuthErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente.",
        });
      }

      return { error };
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Hubo un problema al actualizar tu contraseña.",
        variant: "destructive",
      });
      return { error: error instanceof Error ? error : new Error('unknown') };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    setIsSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) {
        toast({
          title: "Error al reenviar confirmación",
          description: getAuthErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email reenviado",
          description: "Te hemos enviado un nuevo email de confirmación.",
        });
      }

      return { error };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    isSubmitting,
    isSigningOut,
    isAuthenticated: !!user,
    isAdmin,
    isAdminLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    resendConfirmation,
    updatePassword,
  }), [
    user, session, isLoading, isSubmitting, isSigningOut, isAdmin, isAdminLoading,
    signUp, signIn, signInWithGoogle, signOut, resetPassword, resendConfirmation, updatePassword,
  ]);

  // Only show loading spinner if we expect a session (token exists in storage)
  if (isLoading && !user && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          </div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
