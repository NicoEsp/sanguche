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
  isAuthenticated: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  resendConfirmation: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // SECURITY: Server-side admin validation - cannot be bypassed by localStorage manipulation
  const { isAdmin, isValidating: isAdminValidating } = useServerAdminValidation(user);

  // Prefetch critical data when user authenticates
  useEffect(() => {
    if (user && !isLoading) {
      // Prefetch user profile
      queryClient.prefetchQuery({
        queryKey: ['user-profile', user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id, name, user_id, mentoria_completed')
            .eq('user_id', user.id)
            .maybeSingle();
          return data;
        },
      });

      // Prefetch subscription status
      queryClient.prefetchQuery({
        queryKey: ['subscription', user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (!data?.id) return null;

          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', data.id)
            .maybeSingle();
          
          return subscription;
        },
      });

      // Prefetch assessment data for users who might have one
      queryClient.prefetchQuery({
        queryKey: ['assessment-data-check', user.id],
        queryFn: async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!profile?.id) return null;

          const { data } = await supabase
            .from('assessments')
            .select('assessment_result, assessment_values, created_at')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return data;
        },
      });
    }
  }, [user, isLoading, queryClient]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

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
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signUp = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
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
    setIsLoading(true);
    try {
      Mixpanel.track('user_logout');
      Mixpanel.reset(); // Limpiar identidad de Mixpanel
      const { error } = await supabase.auth.signOut();
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth?mode=reset`;
      
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
    };

    return errorMessages[message] || 'Ha ocurrido un error. Inténtalo de nuevo.';
  };

  const value = useMemo(() => ({
    user,
    session,
    isLoading: isLoading || isAdminValidating,
    isAuthenticated: !!user,
    isAdmin, // SECURITY: Now validated server-side, immune to localStorage manipulation
    signUp,
    signIn,
    signOut,
    resetPassword,
    resendConfirmation,
  }), [user, session, isLoading, isAdminValidating, isAdmin]);

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