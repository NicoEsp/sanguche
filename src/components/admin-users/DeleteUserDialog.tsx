import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import type { DeleteDialogTarget } from './shared';

interface DeleteUserDialogProps {
  target: DeleteDialogTarget | null;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteUserDialog({ target, deleting, onConfirm, onClose }: DeleteUserDialogProps) {
  return (
    <AlertDialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar usuario permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente al usuario{' '}
            <strong>{target?.name || target?.email}</strong> y todos sus datos asociados. Esta acción
            no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar usuario'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
