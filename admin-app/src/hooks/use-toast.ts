// This is a compatibility layer for the admin app
// Using sonner instead of the original toast hook
import { toast as sonnerToast } from 'sonner';

export function useToast() {
  return {
    toast: ({ title, description, variant }: { 
      title?: string; 
      description?: string; 
      variant?: 'default' | 'destructive' 
    }) => {
      if (variant === 'destructive') {
        sonnerToast.error(title || 'Error', { description });
      } else {
        sonnerToast.success(title || 'Éxito', { description });
      }
    }
  };
}
