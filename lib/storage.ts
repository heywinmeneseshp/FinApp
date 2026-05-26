import { compress, decompress } from 'lz-string';

const MAX_RETRIES = 3;

export const robustStorage = {
  getItem: (key: string): string | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      try {
        return decompress(raw);
      } catch {
        return raw;
      }
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    const compressed = compress(value);
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        localStorage.setItem(key, compressed);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'QuotaExceededError') {
          if (attempt < MAX_RETRIES - 1) {
            pruneOldestKeys();
          } else {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (!k || k === key) continue;
              keysToRemove.push(k);
            }
            keysToRemove.sort((a, b) => {
              const aSize = localStorage.getItem(a)?.length || 0;
              const bSize = localStorage.getItem(b)?.length || 0;
              return aSize - bSize;
            });
            const toFree = keysToRemove.slice(0, Math.max(1, Math.floor(keysToRemove.length / 4)));
            toFree.forEach(k => localStorage.removeItem(k));
            try {
              localStorage.setItem(key, compressed);
              return;
            } catch {
              console.warn('Storage full even after pruning');
            }
          }
        } else {
          throw err;
        }
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // silent
    }
  },
};

function pruneOldestKeys(): void {
  const entries: { key: string; size: number; ts: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    const v = localStorage.getItem(k);
    if (v) {
      try {
        const parsed = JSON.parse(decompress(v) || v);
        entries.push({ key: k, size: v.length, ts: parsed._storedAt || 0 });
      } catch {
        entries.push({ key: k, size: v.length, ts: 0 });
      }
    }
  }
  entries.sort((a, b) => a.ts - b.ts);
  const toRemove = entries.slice(0, Math.max(1, Math.floor(entries.length / 3)));
  toRemove.forEach(e => localStorage.removeItem(e.key));
}
