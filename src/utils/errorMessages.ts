/**
 * Centralized error message handling utility.
 * Converts technical errors to user-friendly, actionable messages.
 */

const GENERIC_ERROR = 'Hubo un error, intenta nuevamente en unos minutos';

/**
 * Maps technical error messages to user-friendly messages.
 * All technical details are logged to console for debugging.
 */
export function getUserFriendlyError(error: unknown): string {
  // Always log the actual error for debugging
  console.error('[Error]', error);

  if (!error) {
    return GENERIC_ERROR;
  }

  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();

    // Rate limit errors
    if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
      return 'Demasiados intentos. Por favor espera unos minutos e intenta nuevamente.';
    }

    // Timeout errors
    if (errorMsg.includes('timeout') || errorMsg.includes('timed out') || errorMsg.includes('aborted')) {
      return 'La operación está tardando más de lo esperado. Por favor intenta nuevamente.';
    }

    // Network errors
    if (
      errorMsg.includes('network') || 
      errorMsg.includes('fetch') || 
      errorMsg.includes('connection') ||
      errorMsg.includes('failed to fetch')
    ) {
      return 'Problema de conexión. Verifica tu internet e intenta nuevamente.';
    }

    // Edge function / Supabase function errors
    if (
      errorMsg.includes('functionshttp') ||
      errorMsg.includes('edge function') ||
      errorMsg.includes('function returned') ||
      errorMsg.includes('2xx') ||
      errorMsg.includes('4xx') ||
      errorMsg.includes('5xx') ||
      errorMsg.includes('non-2xx')
    ) {
      return GENERIC_ERROR;
    }

    // Permission / Auth errors (keep user-relevant info)
    if (errorMsg.includes('unauthorized') || errorMsg.includes('permission denied')) {
      return 'No tienes permisos para realizar esta acción.';
    }

    // Duplicate errors
    if (errorMsg.includes('already') || errorMsg.includes('duplicate')) {
      return 'Este elemento ya existe.';
    }

    // Not found errors
    if (errorMsg.includes('not found') || errorMsg.includes('no encontrado')) {
      return 'No se encontró el recurso solicitado.';
    }
  }

  return GENERIC_ERROR;
}

/**
 * Maps authentication error messages to user-friendly Spanish messages.
 */
export function getAuthErrorMessage(message: string): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Credenciales incorrectas. Verifica tu email y contraseña.',
    'Email not confirmed': 'Por favor verifica tu email antes de iniciar sesión.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'User already registered': 'Ya existe una cuenta con este email.',
    'Invalid email': 'Por favor ingresa un email válido.',
    'Signup requires a valid password': 'Se requiere una contraseña válida para registrarse.',
    'Email rate limit exceeded': 'Demasiados intentos. Espera unos minutos e intenta nuevamente.',
    'Password is too weak': 'La contraseña es muy débil. Usa al menos 6 caracteres.',
    'User not found': 'No se encontró una cuenta con este email.',
  };

  return errorMessages[message] || GENERIC_ERROR;
}
