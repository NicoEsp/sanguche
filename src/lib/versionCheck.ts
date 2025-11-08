interface VersionInfo {
  version: string;
}

const VERSION_KEY = 'appVersion';

export async function ensureLatestVersion(reloadOnChange = true): Promise<boolean> {
  try {
    const response = await fetch('/version.json', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.warn('Could not fetch version info');
      return false;
    }

    const versionInfo: VersionInfo = await response.json();
    const currentVersion = localStorage.getItem(VERSION_KEY);
    const newVersion = versionInfo.version;

    console.log('Version check:', { currentVersion, newVersion });

    if (currentVersion && currentVersion !== newVersion) {
      console.log('New version detected, reloading...');
      localStorage.setItem(VERSION_KEY, newVersion);
      
      if (reloadOnChange) {
        // Force reload with cache-busting query parameter
        window.location.replace(`${window.location.pathname}?_v=${newVersion}`);
        return true;
      }
    } else if (!currentVersion) {
      // First time loading
      localStorage.setItem(VERSION_KEY, newVersion);
    }

    return false;
  } catch (error) {
    console.error('Error checking version:', error);
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
