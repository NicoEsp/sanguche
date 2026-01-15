import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react';

interface EmailVerificationViewProps {
  email: string;
  onBack: () => void;
  onResend: () => Promise<{ error: Error | null }>;
  isLoading: boolean;
}

export function EmailVerificationView({ 
  email, 
  onBack, 
  onResend, 
  isLoading 
}: EmailVerificationViewProps) {
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0) return;
    
    const { error } = await onResend();
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
        <p className="font-medium text-primary">{email}</p>
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
          onClick={onBack}
          variant="ghost"
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al login
        </Button>
      </div>
    </div>
  );
}
