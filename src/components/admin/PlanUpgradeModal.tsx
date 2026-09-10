import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Gift } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AssignablePlan = Exclude<Database['public']['Enums']['subscription_plan'], 'free'>;

// Planes que se pueden asignar a mano desde el admin, en el orden del selector.
// Sirve tanto para pagos por fuera de LemonSqueezy (B2B por transferencia,
// factura directa) como para accesos bonificados.
const ASSIGNABLE_PLANS: { value: AssignablePlan; label: string; billing: string }[] = [
  { value: 'premium', label: 'Premium', billing: 'suscripción mensual' },
  { value: 'repremium', label: 'RePremium', billing: 'suscripción mensual' },
  { value: 'curso_estrategia', label: 'Curso Estrategia', billing: 'pago único' },
  { value: 'cursos_all', label: 'Cursos All', billing: 'pago único' },
  { value: 'productprepa_business', label: 'ProductPrepa for B2B', billing: 'pago único' },
  { value: 'productastic_review', label: 'Productastic Review', billing: 'pago único' },
];

const DEFAULT_PLAN: AssignablePlan = 'premium';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    name: string | null;
    email: string | null;
    currentPlan: string;
  } | null;
  onSuccess: () => void;
}

// paid_amount es integer en la base: el tope en centavos es 2^31 - 1, o sea
// $21.474.836,47 ARS.
const MAX_PAID_AMOUNT_CENTS = 2_147_483_647;
const MAX_PAID_AMOUNT_LABEL = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
}).format(Math.floor(MAX_PAID_AMOUNT_CENTS / 100));

// Convierte el monto en pesos tecleado por el admin a centavos, que es la
// unidad en la que el webhook de LemonSqueezy guarda paid_amount.
// null = campo vacío (no se registra monto); NaN = valor inválido.
function parseAmountToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) return NaN;
  const cents = Math.round(parsed * 100);
  if (cents > MAX_PAID_AMOUNT_CENTS) return NaN;
  return cents;
}

export function PlanUpgradeModal({ isOpen, onClose, targetUser, onSuccess }: PlanUpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AssignablePlan>(DEFAULT_PLAN);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isComped, setIsComped] = useState(false);
  const { user, isAdmin } = useAuth();

  const selectedPlan = ASSIGNABLE_PLANS.find((p) => p.value === plan) ?? ASSIGNABLE_PLANS[0];

  const resetForm = () => {
    setPlan(DEFAULT_PLAN);
    setAmount('');
    setNotes('');
    setIsComped(false);
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  const handleConfirm = async () => {
    if (!targetUser || !user) return;

    // SECURITY: JWT-based admin validation
    if (!isAdmin) {
      toast({
        title: 'Acceso Denegado',
        description: 'No tienes permisos para realizar esta acción',
        variant: 'destructive',
      });
      return;
    }

    const amountCents = isComped ? null : parseAmountToCents(amount);
    if (Number.isNaN(amountCents)) {
      toast({
        title: 'Monto inválido',
        description: `Ingresá un número entre 0 y ${MAX_PAID_AMOUNT_LABEL}, o dejá el campo vacío`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // El RPC valida admin, actualiza la fila y deja registro en admin_actions_log.
      const { data, error } = await supabase.rpc('admin_update_subscription', {
        p_target_profile_id: targetUser.id,
        p_new_plan: plan,
        p_notes: notes.trim() || undefined,
        p_paid_amount: amountCents ?? undefined,
        p_is_comped: isComped,
      });

      if (error) throw error;

      if (import.meta.env.DEV) {
        console.log('Subscription updated via RPC:', data);
      }

      toast({
        title: 'Plan asignado',
        description: `${targetUser.name || targetUser.email} ahora tiene plan ${selectedPlan.label}${isComped ? ' (bonificado)' : ''}`,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error assigning plan:', error);
      // El RPC explica por qué rechazó la asignación (por ejemplo, una
      // suscripción de LemonSqueezy todavía activa); ese texto es para el admin.
      const message = (error as { message?: string } | null)?.message;
      toast({
        title: 'No se pudo actualizar el plan',
        description: message || 'Error inesperado al asignar el plan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar plan</DialogTitle>
          <DialogDescription>
            Para pagos por fuera de LemonSqueezy (B2B, transferencia) o accesos bonificados.
            No crea nada en LemonSqueezy: la suscripción queda como &quot;Manual&quot; en el listado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Usuario:</p>
              <p className="font-medium break-words">{targetUser?.name || targetUser?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan actual:</p>
              <p className="font-medium capitalize">{targetUser?.currentPlan}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Nuevo plan</Label>
            <Select value={plan} onValueChange={(value) => setPlan(value as AssignablePlan)}>
              <SelectTrigger id="plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_PLANS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedPlan.label} es {selectedPlan.billing}. Si el usuario recibe mail de bienvenida
              para este plan, se le envía igual que en una compra por LemonSqueezy.
            </p>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Checkbox
              id="is-comped"
              checked={isComped}
              onCheckedChange={(checked) => setIsComped(checked === true)}
            />
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-yellow-600" />
              <Label htmlFor="is-comped" className="text-sm cursor-pointer">
                Marcar como bonificado (sin pago)
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid-amount">Monto cobrado (ARS)</Label>
            <Input
              id="paid-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Ej: 1500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isComped}
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Para Premium y RePremium es el monto mensual; para pagos únicos, el total.
              Alimenta las métricas del dashboard igual que un pago por LemonSqueezy.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas internas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Empresa, medio de pago, número de factura..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
