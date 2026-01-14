interface VersionInfo {
  version: string;
}

const VERSION_KEY = 'appVersion';

export async function ensureLatestVersion(reloadOnChange = true): Promise<boolean> {
  try {
    // Limpiar parámetro ?_v= si existe en la URL (de recargas anteriores)
    const url = new URL(window.location.href);
    if (url.searchParams.has('_v')) {
      url.searchParams.delete('_v');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }

    const response = await fetch('/version.json', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      if (import.meta.env.DEV) {
        console.warn('Could not fetch version info');
      }
      return false;
    }

    const versionInfo: VersionInfo = await response.json();
    const currentVersion = localStorage.getItem(VERSION_KEY);
    const newVersion = versionInfo.version;

    if (import.meta.env.DEV) {
      console.log('Version check:', { currentVersion, newVersion });
    }

    if (currentVersion && currentVersion !== newVersion) {
      if (import.meta.env.DEV) {
        console.log('New version detected, reloading...');
      }
      localStorage.setItem(VERSION_KEY, newVersion);
      
      if (reloadOnChange) {
        // Usar reload() en lugar de agregar parámetro para URLs más limpias
        window.location.reload();
        return true;
      }
    } else if (!currentVersion) {
      // First time loading
      localStorage.setItem(VERSION_KEY, newVersion);
    }

    return false;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error checking version:', error);
    }
    return false;
  }
}

export function startVersionPolling(intervalMs = 5 * 60 * 1000): () => void {
  const intervalId = setInterval(() => {
    ensureLatestVersion(true);
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}
