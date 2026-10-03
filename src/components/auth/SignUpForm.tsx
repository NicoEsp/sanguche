import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signUpSchema, SignUpFormData } from './authSchemas';
import { GoogleAuthButton } from './GoogleAuthButton';
import { PasswordInput } from './PasswordInput';
import { AuthDivider } from './AuthDivider';

interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => Promise<void>;
  onGoogleSignIn: () => void;
  isLoading: boolean;
}

export function SignUpForm({ onSubmit, onGoogleSignIn, isLoading }: SignUpFormProps) {
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { errors } = form.formState;

  const handleSubmit = async (data: SignUpFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <GoogleAuthButton
        onClick={onGoogleSignIn}
        isLoading={isLoading}
        label="Registrarse con Google"
      />

      <AuthDivider>o con tu email</AuthDivider>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            className="h-11"
            aria-invalid={!!errors.name}
            {...form.register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="h-11"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signup-password">Contraseña</Label>
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Repetí tu contraseña"
            aria-invalid={!!errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </form>
    </div>
  );
}
