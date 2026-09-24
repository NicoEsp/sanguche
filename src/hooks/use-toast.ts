import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

/**
 * La API de toasts de shadcn, montada sobre Sonner.
 *
 * La app tenía dos sistemas de toasts a la vez: el de Radix (esta API) y
 * Sonner. Los dos viajaban en el bundle inicial y cada uno pintaba en su
 * esquina y con su estilo. Este adaptador deja uno solo sin tocar los
 * llamados existentes.
 */
interface ToastInput {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

function toast({ title, description, variant, duration }: ToastInput) {
  // Sonner siempre necesita un título: sin él, la descripción pasa a ocuparlo.
  const message = title ?? description;
  const options = { description: title ? description : undefined, duration };

  return variant === "destructive"
    ? sonnerToast.error(message, { ...options, richColors: true })
    : sonnerToast(message, options);
}

/**
 * Misma forma que el hook de shadcn (`const { toast } = useToast()`), pero sin
 * suscribirse al estado de los toasts: el de Radix re-renderizaba el componente
 * que lo usaba cada vez que aparecía o se cerraba cualquier toast de la app.
 */
const useToast = () => ({ toast });

export { useToast, toast };
