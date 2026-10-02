import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
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
  AuthShell,
  AuthModeSwitch,
} from '@/components/auth';

type AuthMode = 'login' | 'signup' | 'reset' | 'email-verification' | 'update-password';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, resetPassword, resendConfirmation, updatePassword, isSubmitting, isAuthenticated, session } = useAuth();

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

  // Ruta de origen desde el state de ProtectedRoute. Se conserva el query
  // string: /autoevaluacion?tipo=builder tiene que volver con el perfil elegido.
  const from = location.state?.from as { pathname?: string; search?: string } | undefined;
  const fromPath = from?.pathname ? `${from.pathname}${from.search ?? ''}` : null;
  // Destino post-login por email. Home lee returnTo y redirige (useHomeRedirect),
  // igual que con Google y el enlace de confirmación, que ya lo mandan por URL.
  const postLoginPath = fromPath ? `/?returnTo=${encodeURIComponent(fromPath)}` : '/';

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

  // Redirigir usuarios autenticados. 'reset' queda exceptuado además de
  // 'update-password': se llega ahí desde un enlace vencido, y si quedó una
  // sesión vieja en el browser el redirect se los llevaba a la home en vez de
  // dejarlos pedir el enlace nuevo.
  useEffect(() => {
    if (isAuthenticated && mode !== 'update-password' && mode !== 'reset') {
      navigate(postLoginPath, { replace: true });
    }
  }, [isAuthenticated, navigate, mode, postLoginPath]);

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
      trackEvent('login_completed', { method: 'email', email: data.email, from_path: fromPath });
      navigate(postLoginPath, { replace: true });
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
      case 'login': return 'Iniciar sesión';
      case 'signup': return 'Crear cuenta';
      case 'reset': return 'Recuperar contraseña';
      case 'email-verification': return 'Verificá tu email';
      case 'update-password': return 'Nueva contraseña';
    }
  };

  const getHeading = () => {
    switch (mode) {
      case 'login': return 'Qué bueno verte de nuevo';
      case 'signup': return 'Empezá tu evaluación';
      case 'reset': return 'Recuperá tu acceso';
      case 'email-verification': return 'Revisá tu email';
      case 'update-password': return 'Elegí tu nueva contraseña';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Ingresá para retomar tu evaluación y tus recomendaciones.';
      case 'signup': return 'Creá tu cuenta gratis y descubrí tu nivel en 5 minutos.';
      case 'reset': return 'Ingresá tu email y te mandamos un enlace para elegir una contraseña nueva.';
      case 'email-verification': return 'Te enviamos un correo para validar tu cuenta.';
      case 'update-password':
        return recovery.status === 'expired'
          ? 'El enlace de recuperación ya no es válido.'
          : 'Usá una contraseña de al menos 6 caracteres.';
    }
  };

  const showModeSwitch = mode === 'login' || mode === 'signup';
  const showBackToLogin = mode === 'reset' || mode === 'update-password';

  return (
    <>
      <Seo
        title={`${getTitle()} — ProductPrepa`}
        description="Accede a tu cuenta de ProductPrepa para continuar con tu evaluación y recomendaciones personalizadas."
        canonical="/auth"
        keywords="login productprepa, registro PM, acceso cuenta"
      />

      <AuthShell>
        <div className="space-y-8">
          {showModeSwitch && <AuthModeSwitch mode={mode} onChange={setMode} />}

          {showBackToLogin && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 text-muted-foreground"
              onClick={() => setMode('login')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a iniciar sesión
            </Button>
          )}

          {mode !== 'email-verification' && (
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-balance">{getHeading()}</h1>
              <p className="text-muted-foreground">{getDescription()}</p>
            </div>
          )}

          {mode === 'login' && (
            <LoginForm
              onSubmit={handleLogin}
              onGoogleSignIn={handleGoogleSignIn}
              onForgotPassword={() => setMode('reset')}
              isLoading={isSubmitting}
            />
          )}

          {mode === 'signup' && (
            <SignUpForm onSubmit={handleSignUp} onGoogleSignIn={handleGoogleSignIn} isLoading={isSubmitting} />
          )}

          {mode === 'reset' && (
            <ResetPasswordForm onSubmit={handleResetPassword} isLoading={isSubmitting} />
          )}

          {mode === 'update-password' && (
            <UpdatePasswordForm
              onSubmit={handleUpdatePassword}
              isLoading={isSubmitting}
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
              isLoading={isSubmitting}
            />
          )}
        </div>
      </AuthShell>
    </>
  );
}
