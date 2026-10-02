import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, AlertCircle } from 'lucide-react';
import { updatePasswordSchema, UpdatePasswordFormData } from './authSchemas';
import { RecoveryStatus } from './useRecoveryLink';
import { PasswordInput } from './PasswordInput';

interface UpdatePasswordFormProps {
  onSubmit: (data: UpdatePasswordFormData) => Promise<void>;
  isLoading: boolean;
  status: RecoveryStatus;
  errorMessage: string | null;
  onConfirmLink: () => void;
  onRequestNewLink: () => void;
}

export function UpdatePasswordForm({
  onSubmit,
  isLoading,
  status,
  errorMessage,
  onConfirmLink,
  onRequestNewLink,
}: UpdatePasswordFormProps) {
  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (data: UpdatePasswordFormData) => {
    await onSubmit(data);
    form.reset();
  };

  // The link is redeemed here, on a click, and not when the page loads: mail
  // providers that pre-open links (Outlook/Hotmail above all) would otherwise
  // burn the one-time token before the person ever sees the mail.
  if (status === 'confirm') {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="rounded-full bg-primary/10 p-3">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Confirmá que sos vos para elegir una contraseña nueva.
        </p>
        <Button className="w-full" onClick={onConfirmLink} disabled={isLoading}>
          Continuar
        </Button>
      </div>
    );
  }

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Verificando enlace de recuperación...
        </p>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          {errorMessage ?? 'Este enlace ya fue usado o venció.'}
        </p>
        <Button className="w-full" onClick={onRequestNewLink}>
          Pedir un enlace nuevo
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirmar contraseña</Label>
        <PasswordInput
          id="confirm-new-password"
          autoComplete="new-password"
          placeholder="Repetí tu contraseña"
          {...form.register('confirmPassword')}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      
      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Actualizando...
          </>
        ) : (
          'Actualizar contraseña'
        )}
      </Button>
    </form>
  );
}
