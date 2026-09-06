import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EditNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string | null;
  profileId: string;
  onSuccess: () => void;
}

export function EditNameDialog({
  open,
  onOpenChange,
  currentName,
  profileId,
  onSuccess
}: EditNameDialogProps) {
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(currentName || '');
  }, [currentName]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'El nombre no puede estar vacío', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', profileId);

    setLoading(false);

    if (error) {
      toast({ title: 'Error al actualizar el nombre', variant: 'destructive' });
    } else {
      toast({ title: 'Nombre actualizado' });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar nombre</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !loading) handleSave(); }}
              placeholder="Tu nombre"
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
