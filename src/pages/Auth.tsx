import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';
import {
  LoginForm,
  SignUpForm,
  ResetPasswordForm,
  UpdatePasswordForm,
  EmailVerificationView,
  LoginFormData,
  SignUpFormData,
  ResetFormData,
  UpdatePasswordFormData,
  useRecoveryLink,
} from '@/components/auth';

type AuthMode = 'login' | 'signup' | 'reset' | 'email-verification' | 'update-password';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, resetPassword, resendConfirmation, updatePassword, isLoading, isAuthenticated, session } = useAuth();

  // Reads the URL on the very first render, so a recovery landing is known
  // before any redirect effect can bounce an already-logged-in user home.
  const recovery = useRecoveryLink(session);

  const [mode, setMode] = useState<AuthMode>(() =>
    // Default: signup para optimizar conversión
    recovery.isRecovery ? 'update-password' : 'signup'
  );
  const [verificationEmail, setVerificationEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { trackEvent } = useMixpanelTracking();
  const { toast } = useToast();

  // Obtener ruta de origen desde el state de ProtectedRoute
  const fromPath = location.state?.from?.pathname || null;

  const handleGoogleSignIn = async () => {
    trackEvent('google_signin_started');
    await signInWithGoogle(fromPath);
  };

  // El enlace puede confirmarse después del primer render (el cliente de
  // Supabase procesa el hash de forma asíncrona), así que seguimos el hook.
  useEffect(() => {
    if (recovery.isRecovery) {
      setMode('update-password');
    }
  }, [recovery.isRecovery]);

  // Volver a "olvidé mi contraseña" cuando el enlace ya no sirve
  const handleRequestNewLink = () => {
    recovery.reset();
    setMode('reset');
    toast({
      title: "Pedí un enlace nuevo",
      description: "Ingresá tu email y te mandamos otro enlace de recuperación.",
    });
  };

  // Redirigir usuarios autenticados (excepto si están actualizando contraseña)
  useEffect(() => {
    if (isAuthenticated && mode !== 'update-password') {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate, mode]);

  // Verificar si viene con modo específico en URL
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'reset') {
      setMode('reset');
    }
  }, [searchParams]);

  // Track auth page view
  useEffect(() => {
    trackEvent('auth_page_view', { mode });
  }, [mode, trackEvent]);

  // Form handlers with tracking
  const handleLogin = async (data: LoginFormData) => {
    trackEvent('login_started', { method: 'email', email: data.email });
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      trackEvent('login_completed', { method: 'email', email: data.email });
      navigate('/', { replace: true });
    } else {
      trackEvent('login_failed', { method: 'email', email: data.email, error: error.message });
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    trackEvent('signup_started', { method: 'email', email: data.email, from_path: fromPath });
    const { error } = await signUp(data.email, data.password, data.name, fromPath);
    if (!error) {
      trackEvent('signup_completed', { method: 'email', email: data.email, name: data.name, from_path: fromPath });
      setVerificationEmail(data.email);
      setMode('email-verification');
    } else {
      trackEvent('signup_failed', { method: 'email', email: data.email, error: error.message });
    }
  };

  const handleResetPassword = async (data: ResetFormData) => {
    await resetPassword(data.email);
    setMode('login');
  };

  const handleUpdatePassword = async (data: UpdatePasswordFormData) => {
    trackEvent('password_update_started');
    const { error } = await updatePassword(data.password);
    if (!error) {
      trackEvent('password_update_completed');
      setMode('login');
      navigate('/auth', { replace: true });
    } else {
      trackEvent('password_update_failed', { error: error.message });
    }
  };

  const handleResendConfirmation = async () => {
    return resendConfirmation(verificationEmail);
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Iniciar Sesión';
      case 'signup': return 'Crear Cuenta';
      case 'reset': return 'Recuperar Contraseña';
      case 'email-verification': return 'Verifica tu Email';
      case 'update-password': return 'Nueva Contraseña';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Ingresa tus credenciales para acceder a tu cuenta';
      case 'signup': return 'Crea una cuenta nueva para empezar';
      case 'reset': return 'Te enviaremos un enlace para restablecer tu contraseña';
      case 'email-verification': return 'Te enviamos un correo para validar tu cuenta';
      case 'update-password':
        return recovery.status === 'expired'
          ? 'El enlace de recuperación ya no es válido'
          : 'Ingresa tu nueva contraseña';
    }
  };

  return (
    <>
      <Seo
        title={`${getTitle()} — ProductPrepa`}
        description="Accede a tu cuenta de ProductPrepa para continuar con tu evaluación y recomendaciones personalizadas."
        canonical="/login"
        keywords="login productprepa, registro PM, acceso cuenta"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{getTitle()}</CardTitle>
            <CardDescription className="text-center">{getDescription()}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {mode === 'login' && (
              <LoginForm onSubmit={handleLogin} onGoogleSignIn={handleGoogleSignIn} isLoading={isLoading} />
            )}

            {mode === 'signup' && (
              <SignUpForm onSubmit={handleSignUp} onGoogleSignIn={handleGoogleSignIn} isLoading={isLoading} />
            )}

            {mode === 'reset' && (
              <ResetPasswordForm onSubmit={handleResetPassword} isLoading={isLoading} />
            )}

            {mode === 'update-password' && (
              <UpdatePasswordForm
                onSubmit={handleUpdatePassword}
                isLoading={isLoading}
                status={recovery.status}
                errorMessage={recovery.errorMessage}
                onConfirmLink={recovery.confirm}
                onRequestNewLink={handleRequestNewLink}
              />
            )}

            {mode === 'email-verification' && (
              <EmailVerificationView
                email={verificationEmail}
                onBack={() => setMode('login')}
                onResend={handleResendConfirmation}
                isLoading={isLoading}
              />
            )}

            <div className="space-y-4">
              <Separator />
              
              {mode !== 'email-verification' && mode !== 'update-password' && (
                <div className="text-center space-y-3">
                  {mode === 'login' && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setMode('signup')}
                      >
                        ¿No tienes cuenta? Regístrate
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-sm"
                        onClick={() => setMode('reset')}
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </>
                  )}
                  
                  {mode === 'signup' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setMode('login')}
                    >
                      ¿Ya tienes cuenta? Inicia sesión
                    </Button>
                  )}
                  
                  {mode === 'reset' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setMode('login')}
                    >
                      Volver al inicio de sesión
                    </Button>
                  )}
                </div>
              )}

              {mode === 'update-password' && (
                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-sm"
                    onClick={() => setMode('login')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesión
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
