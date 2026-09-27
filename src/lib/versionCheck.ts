/**
 * Detecta deploys nuevos mientras la pestaña está abierta.
 *
 * Compara /version.json con la versión del bundle que está corriendo
 * (__APP_VERSION__, la define vite.config.ts). Antes comparaba contra
 * localStorage, así que después de cada deploy todo el que volvía al sitio
 * cargaba la página dos veces aunque ya tuviera el bundle nuevo.
 *
 * Tampoco recarga en el momento: hacerlo en medio de la evaluación o de un
 * formulario perdía lo cargado. Con un deploy nuevo detectado, la próxima
 * navegación dentro del SPA se hace como carga completa (ver VersionReloader).
 */

const POLL_INTERVAL_MS = 5 * 60 * 1000;
const CHUNK_RELOAD_KEY = 'pp_chunk_reload_at';

let updateAvailable = false;

async function checkForUpdate(): Promise<void> {
  if (updateAvailable) return;
  try {
    const response = await fetch('/version.json', { cache: 'no-store' });
    if (!response.ok) return;
    const { version } = (await response.json()) as { version?: string };
    if (version && version !== __APP_VERSION__) updateAvailable = true;
  } catch {
    // Sin red o sin version.json: se vuelve a intentar en el próximo ciclo.
  }
}

/** Hay un deploy más nuevo que el bundle que está corriendo. */
export const isUpdateAvailable = (): boolean => updateAvailable;

export function startVersionWatcher(): void {
  if (import.meta.env.DEV) return;

  setInterval(() => {
    if (document.visibilityState === 'visible') void checkForUpdate();
  }, POLL_INTERVAL_MS);

  // Volver a una pestaña que quedó abierta horas es el caso típico de bundle viejo.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkForUpdate();
  });

  // Un deploy borra los chunks del anterior, y una pestaña vieja que navega a
  // una ruta lazy todavía no cargada pide un archivo que ya no existe. Vite
  // avisa con este evento: se recarga una vez para traer el bundle nuevo. La
  // guarda evita un loop si el chunk falla por otra razón (sin red, bloqueado).
  window.addEventListener('vite:preloadError', (event) => {
    try {
      const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY)) || 0;
      if (Date.now() - lastReload < 60_000) return;
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    } catch {
      return;
    }
    event.preventDefault();
    window.location.reload();
  });
}
