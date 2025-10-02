import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// SECURITY: Single hardcoded admin email - cannot be bypassed
const ADMIN_EMAIL = 'nicolassespindola@gmail.com';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthorizedAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // SECURITY: Check if authenticated user is the authorized admin
  const isAuthorizedAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // SECURITY: Block non-admin users immediately
        if (session?.user && session.user.email !== ADMIN_EMAIL) {
          toast.error('Acceso denegado', {
            description: 'No tienes permisos para acceder al panel de administración.',
          });
          supabase.auth.signOut();
          return;
        }

        if (event === 'SIGNED_IN' && session?.user.email === ADMIN_EMAIL) {
          toast.success('¡Bienvenido al panel de administración!');
        } else if (event === 'SIGNED_OUT') {
          toast.success('Sesión cerrada correctamente');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // SECURITY: Block non-admin on initial load
      if (session?.user && session.user.email !== ADMIN_EMAIL) {
        supabase.auth.signOut();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // SECURITY: Pre-validate email before even attempting login
    if (email !== ADMIN_EMAIL) {
      toast.error('Acceso denegado', {
        description: 'No tienes permisos para acceder al panel de administración.',
      });
      return { error: { message: 'Unauthorized admin access' } };
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Error al iniciar sesión', {
          description: getErrorMessage(error.message),
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

  const getErrorMessage = (message: string): string => {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Credenciales incorrectas. Verifica tu email y contraseña.',
      'Email not confirmed': 'Por favor verifica tu email antes de iniciar sesión.',
      'Invalid email': 'Por favor ingresa un email válido.',
    };

    return errorMessages[message] || 'Ha ocurrido un error. Inténtalo de nuevo.';
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isAuthorizedAdmin,
    signIn,
    signOut,
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
