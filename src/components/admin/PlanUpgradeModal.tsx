import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

export function PlanUpgradeModal({ isOpen, onClose, targetUser, onSuccess }: PlanUpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const { user, isAdmin } = useAuth();

  const handleUpgrade = async () => {
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

    setLoading(true);
    try {
      // Use secure RPC function that handles RLS and logging
      const { data, error: updateError } = await supabase.rpc('admin_update_subscription', {
        p_target_profile_id: targetUser.id,
        p_new_plan: 'premium',
        p_notes: notes || null
      });

      if (updateError) throw updateError;

      if (import.meta.env.DEV) {
        console.log('Subscription updated via RPC:', data);
      }

      toast({
        title: 'Usuario actualizado',
        description: `${targetUser.name || targetUser.email} ahora tiene plan Premium`,
      });

      onSuccess();
      onClose();
      setNotes('');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error upgrading user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el plan del usuario',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actualizar a Premium</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Usuario:</p>
            <p className="font-medium">{targetUser?.name || targetUser?.email}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Plan actual:</p>
            <p className="font-medium capitalize">{targetUser?.currentPlan}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Nuevo plan:</p>
            <p className="font-medium text-primary">Premium</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas internas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Razón del upgrade manual..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleUpgrade} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
