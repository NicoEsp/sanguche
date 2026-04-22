import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'yafu:downloaded-resources';
const UPDATE_EVENT = 'yafu:downloaded-resources-updated';

function readIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // storage unavailable (private mode, quota, etc.) — degrade gracefully
  }
}

export function useDownloadedResources() {
  const [ids, setIds] = useState<Set<string>>(() => readIds());

  useEffect(() => {
    const sync = () => setIds(readIds());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) sync();
    };
    window.addEventListener(UPDATE_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const markDownloaded = useCallback((id: string) => {
    const current = readIds();
    if (current.has(id)) return;
    current.add(id);
    writeIds(current);
  }, []);

  return { downloadedIds: ids, markDownloaded };
}
