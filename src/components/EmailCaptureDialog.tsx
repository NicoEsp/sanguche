import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { z } from "zod";
import type { PlanType } from "./LemonSqueezyCheckout";

const emailSchema = z.string().email("Por favor ingresa un email válido");

interface EmailCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSubmit: (email: string) => void;
  isLoading: boolean;
  plan?: PlanType;
}

const getDialogContent = (plan?: PlanType) => {
  switch (plan) {
    case 'curso_estrategia':
      return {
        title: "Ingresa tu email para comprar",
        description: "Al completar tu pago, tendrás acceso de por vida al curso Estrategia de Producto.",
        securityNote: "🔒 Pago único y seguro. Acceso de por vida."
      };
    case 'cursos_all':
      return {
        title: "Ingresa tu email para comprar",
        description: "Al completar tu pago, tendrás acceso de por vida a todos los cursos actuales y futuros.",
        securityNote: "🔒 Pago único y seguro. Acceso de por vida."
      };
    case 'repremium':
      return {
        title: "Ingresa tu email para suscribirte",
        description: "Al completar tu pago, tendrás acceso a RePremium con 2 sesiones mensuales 1:1 y todos los cursos.",
        securityNote: "🔒 Pago seguro procesado por Lemon Squeezy. Cancela cuando quieras."
      };
    default: // premium
      return {
        title: "Ingresa tu email para suscribirte",
        description: "Al completar tu pago, tendrás acceso a tu mentoría Premium con sesión mensual 1:1.",
        securityNote: "🔒 Pago seguro procesado por Lemon Squeezy. Cancela cuando quieras."
      };
  }
};

export function EmailCaptureDialog({ open, onOpenChange, onEmailSubmit, isLoading, plan }: EmailCaptureDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const content = getDialogContent(plan);

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
            {content.title}
          </DialogTitle>
          <DialogDescription>
            {content.description}
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
              {content.securityNote}
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
