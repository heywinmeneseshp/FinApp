'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { syncPendingOperations, getLastSyncAt, getPendingCount, onConnectivityChange, type SyncResult } from '@/lib/sync';

interface UseSyncReturn {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  syncNow: () => Promise<SyncResult>;
}

export function useSync(): UseSyncReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const isMounted = useRef(true);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    if (isMounted.current) setPendingCount(count);
  }, []);

  const refreshLastSync = useCallback(() => {
    const stored = getLastSyncAt();
    if (isMounted.current) setLastSyncAt(stored);
  }, []);

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (isSyncing) return { applied: 0, pulled: 0, error: 'Ya sincronizando' };
    setIsSyncing(true);
    try {
      const result = await syncPendingOperations();
      refreshLastSync();
      await refreshPendingCount();
      return result;
    } finally {
      if (isMounted.current) setIsSyncing(false);
    }
  }, [isSyncing, refreshLastSync, refreshPendingCount]);

  useEffect(() => {
    isMounted.current = true;
    refreshLastSync();
    refreshPendingCount();

    // Escuchar cambios de conectividad
    const cleanup = onConnectivityChange(async (connected) => {
      if (connected) {
        await syncNow();
      }
    });

    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, [syncNow, refreshLastSync, refreshPendingCount]);

  return { isSyncing, lastSyncAt, pendingCount, syncNow };
}
