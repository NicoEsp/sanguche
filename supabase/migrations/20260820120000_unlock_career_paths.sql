-- El Career Path ya no se "cierra": el usuario edita siempre y los cambios se guardan
-- automáticamente. El botón "Guardar Career Path" (que bloqueaba el mapa) fue reemplazado
-- por "Exportar PDF", así que ningún flujo vuelve a setear is_locked.
--
-- Desbloqueamos los mapas que quedaron cerrados con el flujo anterior para que esos
-- usuarios puedan volver a mover y agregar objetivos sin depender de un admin.
UPDATE public.user_progress_objectives
SET is_locked = false,
    locked_at = NULL
WHERE is_locked = true;

COMMENT ON COLUMN public.user_progress_objectives.is_locked IS 'Deprecado: el Career Path ya no se bloquea desde la app. Se mantiene por compatibilidad histórica.';
COMMENT ON COLUMN public.user_progress_objectives.locked_at IS 'Deprecado: el Career Path ya no se bloquea desde la app. Se mantiene por compatibilidad histórica.';
