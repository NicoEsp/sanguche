import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff, Mail, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';

const loginSchema = z.object({
  email: z.string().email('Por favor ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const signUpSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre debe tener menos de 100 caracteres')
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
      'El nombre solo puede contener letras, espacios, guiones y apóstrofes'
    ),
  email: z.string().email('Por favor ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const resetSchema = z.object({
  email: z.string().email('Por favor ingresa un email válido'),
});

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;
type ResetFormData = z.infer<typeof resetSchema>;
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'email-verification' | 'update-password'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const { signIn, signUp, resetPassword, resendConfirmation, updatePassword, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { trackEvent } = useMixpanelTracking();

  // Detectar token de recovery en URL hash (viene del email de Supabase)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      
      if (type === 'recovery' && accessToken) {
        setMode('update-password');
        // Limpiar el hash de la URL para mejor UX
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

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

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    },
  });

  const updatePasswordForm = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    trackEvent('login_started', { email: data.email });
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      trackEvent('login_completed', { email: data.email });
      navigate('/', { replace: true });
    } else {
      trackEvent('login_failed', { email: data.email, error: error.message });
    }
  };

  const onSignUpSubmit = async (data: SignUpFormData) => {
    trackEvent('signup_started', { email: data.email });
    const { error } = await signUp(data.email, data.password, data.name);
    if (!error) {
      trackEvent('signup_completed', { email: data.email, name: data.name });
      setVerificationEmail(data.email);
      setMode('email-verification');
      signUpForm.reset();
    } else {
      trackEvent('signup_failed', { email: data.email, error: error.message });
    }
  };

  const onResetSubmit = async (data: ResetFormData) => {
    await resetPassword(data.email);
    resetForm.reset();
    setMode('login');
  };

  const onUpdatePasswordSubmit = async (data: UpdatePasswordFormData) => {
    trackEvent('password_update_started');
    const { error } = await updatePassword(data.password);
    if (!error) {
      trackEvent('password_update_completed');
      updatePasswordForm.reset();
      setMode('login');
      navigate('/auth', { replace: true });
    } else {
      trackEvent('password_update_failed', { error: error.message });
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0) return;
    
    const { error } = await resendConfirmation(verificationEmail);
    if (!error) {
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <>
      <Seo
        title={`${
          mode === 'login' ? 'Iniciar Sesión' : 
          mode === 'signup' ? 'Registrarse' : 
          mode === 'reset' ? 'Recuperar Contraseña' :
          mode === 'update-password' ? 'Nueva Contraseña' :
          'Verifica tu Email'
        } — ProductPrepa`}
        description="Accede a tu cuenta de ProductPrepa para continuar con tu evaluación y recomendaciones personalizadas."
        canonical="/login"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {mode === 'login' && 'Iniciar Sesión'}
              {mode === 'signup' && 'Crear Cuenta'}
              {mode === 'reset' && 'Recuperar Contraseña'}
              {mode === 'email-verification' && 'Verifica tu Email'}
              {mode === 'update-password' && 'Nueva Contraseña'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'login' && 'Ingresa tus credenciales para acceder a tu cuenta'}
              {mode === 'signup' && 'Crea una cuenta nueva para empezar'}
              {mode === 'reset' && 'Te enviaremos un enlace para restablecer tu contraseña'}
              {mode === 'email-verification' && 'Te enviamos un correo para validar tu cuenta'}
              {mode === 'update-password' && 'Ingresa tu nueva contraseña'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {mode === 'login' && (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      {...loginForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>
            )}

            {mode === 'signup' && (
              <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    {...signUpForm.register('name')}
                  />
                  {signUpForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@email.com"
                    {...signUpForm.register('email')}
                  />
                  {signUpForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      {...signUpForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {signUpForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      {...signUpForm.register('confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {signUpForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {signUpForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>
              </form>
            )}

            {mode === 'reset' && (
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu@email.com"
                    {...resetForm.register('email')}
                  />
                  {resetForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {resetForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Email de Recuperación'
                  )}
                </Button>
              </form>
            )}

            {mode === 'update-password' && (
              <form onSubmit={updatePasswordForm.handleSubmit(onUpdatePasswordSubmit)} className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <KeyRound className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      {...updatePasswordForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {updatePasswordForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {updatePasswordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      {...updatePasswordForm.register('confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {updatePasswordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {updatePasswordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Contraseña'
                  )}
                </Button>
              </form>
            )}

            {mode === 'email-verification' && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Revisa tu bandeja de entrada</h3>
                  <p className="text-muted-foreground">
                    Te enviamos un correo de confirmación a:
                  </p>
                  <p className="font-medium text-primary">{verificationEmail}</p>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Haz clic en el enlace del correo para activar tu cuenta.
                  </p>
                  <p>
                    Si no encuentras el correo, revisa tu carpeta de spam.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleResendConfirmation}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading || resendCooldown > 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reenviando...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reenviar en {resendCooldown}s
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reenviar correo
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setMode('login')}
                    variant="ghost"
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al login
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Separator />
              
              {mode !== 'email-verification' && mode !== 'update-password' && (
                <div className="text-center space-y-2">
                  {mode === 'login' && (
                    <>
                      <Button
                        variant="link"
                        className="text-sm"
                        onClick={() => setMode('signup')}
                      >
                        ¿No tienes cuenta? Regístrate
                      </Button>
                      <Button
                        variant="link"
                        className="text-sm block mx-auto"
                        onClick={() => setMode('reset')}
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </>
                  )}
                  
                  {mode === 'signup' && (
                    <Button
                      variant="link"
                      className="text-sm"
                      onClick={() => setMode('login')}
                    >
                      ¿Ya tienes cuenta? Inicia sesión
                    </Button>
                  )}
                  
                  {mode === 'reset' && (
                    <Button
                      variant="link"
                      className="text-sm"
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
