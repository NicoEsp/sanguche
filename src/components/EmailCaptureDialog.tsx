import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Por favor ingresa un email válido");

interface EmailCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSubmit: (email: string) => void;
  isLoading: boolean;
}

export function EmailCaptureDialog({ open, onOpenChange, onEmailSubmit, isLoading }: EmailCaptureDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = emailSchema.safeParse(email.trim());
    
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    onEmailSubmit(result.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Ingresa tu email para continuar
          </DialogTitle>
          <DialogDescription>
            Al completar tu pago, te enviaremos acceso inmediato a tu cuenta Premium con todos los beneficios incluidos.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              disabled={isLoading}
              required
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Continuar al pago"
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              🔒 Pago 100% seguro procesado por Lemon Squeezy. Cancela cuando quieras.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
