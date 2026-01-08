import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useServerAdminValidation } from '@/hooks/useServerAdminValidation';
import { Mixpanel } from '@/lib/mixpanel';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSigningOut: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // SECURITY: Server-side admin validation - cannot be bypassed by localStorage manipulation
  const { isAdmin, isValidating: isAdminValidating } = useServerAdminValidation(user);

  // Prefetch critical data when user authenticates - OPTIMIZED: Single composite query
  // Uses same structure as useProfileCompositeData hook for cache compatibility
  useEffect(() => {
    if (user && !isLoading) {
      queryClient.prefetchQuery({
        queryKey: ['user-composite-data', user.id],
        queryFn: async () => {
          // Fetch profile with subscription in single query
          const { data: profileData } = await supabase
            .from('profiles')
            .select(`
              id, 
              name, 
              user_id, 
              mentoria_completed,
              last_mentoria_date,
              is_founder,
              user_subscriptions(plan, status, current_period_end, purchase_type)
            `)
            .eq('user_id', user.id)
            .maybeSingle();

          // Fetch assessments count
          const { data: assessmentsData } = await supabase
            .from('assessments')
            .select('id, updated_at')
            .eq('user_id', profileData?.id || '')
            .order('updated_at', { ascending: false })
            .limit(100);

          // Transform to ProfileCompositeData format
          const subscriptionData = profileData?.user_subscriptions;
          const purchaseType = subscriptionData?.purchase_type || 'subscription';

          return {
            profile: profileData ? {
              id: profileData.id,
              name: profileData.name,
              user_id: profileData.user_id || '',
              mentoria_completed: profileData.mentoria_completed,
              last_mentoria_date: profileData.last_mentoria_date,
              is_founder: profileData.is_founder,
            } : null,
            subscription: subscriptionData ? {
              plan: subscriptionData.plan,
              status: subscriptionData.status,
              current_period_end: subscriptionData.current_period_end 
                ? new Date(subscriptionData.current_period_end) 
                : null,
              purchase_type: purchaseType,
              isOneTimePurchase: purchaseType === 'one_time',
            } : {
              plan: 'free',
              status: 'active',
              current_period_end: null,
              purchase_type: 'subscription',
              isOneTimePurchase: false,
            },
            assessmentsCount: assessmentsData?.length || 0,
            lastAssessmentDate: assessmentsData?.[0]?.updated_at || null,
          };
        },
      });
    }
  }, [user, isLoading, queryClient]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    let subscriptionChannel: ReturnType<typeof supabase.channel> | null = null;
    let assessmentChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSync = async () => {
      profileChannel = supabase
        .channel(`auth-profile-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
            queryClient.invalidateQueries({ queryKey: ['user-composite-data', user.id] });
          }
        )
        .subscribe();

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!active || !profile?.id) {
        return;
      }

      subscriptionChannel = supabase
        .channel(`auth-subscription-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['subscription', user.id] });
            queryClient.invalidateQueries({ queryKey: ['user-composite-data', user.id] });
          }
        )
        .subscribe();

      assessmentChannel = supabase
        .channel(`auth-assessments-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'assessments',
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['assessment-data', user.id] });
            queryClient.invalidateQueries({ queryKey: ['assessment-data-check', user.id] });
            queryClient.invalidateQueries({ queryKey: ['user-composite-data', user.id] });
          }
        )
        .subscribe();
    };

    setupRealtimeSync();

    return () => {
      active = false;
      if (profileChannel) supabase.removeChannel(profileChannel);
      if (subscriptionChannel) supabase.removeChannel(subscriptionChannel);
      if (assessmentChannel) supabase.removeChannel(assessmentChannel);
    };
  }, [user, queryClient]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsLoading(false);

        // Bootstrap: asegurar datos base existen
        if (currentUser) {
          (async () => {
            try {
              await supabase.rpc('ensure_user_defaults');
            } catch (error) {
              if (import.meta.env.DEV) {
                console.error('[AuthContext] Error ensuring user defaults:', error);
              }
            }
          })();
        }

        if (event === 'SIGNED_OUT') {
          toast({
            title: "Sesión cerrada",
            description: "Has cerrado sesión correctamente.",
          });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsLoading(false);

      // Bootstrap inicial si ya está logueado
      if (currentUser) {
        (async () => {
          try {
            await supabase.rpc('ensure_user_defaults');
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[AuthContext] Error ensuring user defaults:', error);
            }
          }
        })();
      }
    });

    return () => subscription.unsubscribe();
  }, [toast, queryClient]);

  const signUp = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/?new_user=true`;
      
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
          description: getErrorMessage(error.message),
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
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Error al iniciar sesión",
          description: getErrorMessage(error.message),
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
      setIsLoading(false);
    }
  };

  const signOut = async () => {
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
  };

  const resetPassword = async (email: string) => {
    try {
      // Redirect to /auth - Supabase will append recovery params automatically
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Error al enviar email",
          description: getErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado",
          description: "Revisa tu correo para restablecer tu contraseña.",
        });
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Error al actualizar contraseña",
          description: getErrorMessage(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente.",
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Error inesperado",
        description: "Hubo un problema al actualizar tu contraseña.",
        variant: "destructive",
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmation = async (email: string) => {
    setIsLoading(true);
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
          description: getErrorMessage(error.message),
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
      setIsLoading(false);
    }
  };

  const getErrorMessage = (message: string): string => {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Credenciales incorrectas. Verifica tu email y contraseña.',
      'Email not confirmed': 'Por favor verifica tu email antes de iniciar sesión.',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
      'User already registered': 'Ya existe una cuenta con este email.',
      'Invalid email': 'Por favor ingresa un email válido.',
      'Signup requires a valid password': 'Se requiere una contraseña válida para registrarse.',
      'Email rate limit exceeded': 'Demasiados intentos. Espera unos minutos e intenta nuevamente.',
      'Password is too weak': 'La contraseña es muy débil. Usa al menos 6 caracteres.',
      'User not found': 'No se encontró una cuenta con este email.',
    };

    return errorMessages[message] || 'Hubo un error, intenta nuevamente en unos minutos.';
  };

  const value = useMemo(() => ({
    user,
    session,
    isLoading: isLoading || isAdminValidating,
    isSigningOut,
    isAuthenticated: !!user,
    isAdmin,
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendConfirmation,
    updatePassword,
  }), [user, session, isLoading, isAdminValidating, isAdmin, isSigningOut]);

  // Render loading screen during initial auth check to prevent context access errors
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