import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Configurar listener de cambios de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Sesión cerrada",
            description: "Has cerrado sesión correctamente.",
          });
        }
      }
    );

    // Verificar sesión existente
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
      }

      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
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

  // Función para traducir mensajes de error comunes
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

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

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