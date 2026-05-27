import { getSession } from 'next-auth/react';
import { Network } from '@capacitor/network';
import { getPendingSyncOperations, markSynced } from './localDb';

const STORAGE_KEY = 'finapp_last_sync_at';

// â”€â”€â”€ Almacenamiento de last_sync_at â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function getLastSyncAt(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  return storage.getItem(STORAGE_KEY);
}

function setLastSyncAt(value: string): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, value);
}

// â”€â”€â”€ Conectividad â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function checkConnectivity(): Promise<boolean> {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    return typeof navigator !== 'undefined' ? navigator.onLine : false;
  }
}

export function onConnectivityChange(callback: (connected: boolean) => void): () => void {
  let cleanup: (() => void) | null = null;

  const setupListener = async () => {
    try {
      await Network.addListener('networkStatusChange', (status) => {
        callback(status.connected);
      });
      cleanup = () => { Network.removeAllListeners(); };
    } catch {
      const handler = () => callback(navigator.onLine);
      window.addEventListener('online', handler);
      window.addEventListener('offline', handler);
      cleanup = () => {
        window.removeEventListener('online', handler);
        window.removeEventListener('offline', handler);
      };
    }
  };

  setupListener();
  return () => { cleanup?.(); };
}

// â”€â”€â”€ Sincronización â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface SyncResult {
  applied: number;
  pulled: number;
  error?: string;
}

export async function syncPendingOperations(): Promise<SyncResult> {
  const online = await checkConnectivity();
  if (!online) return { applied: 0, pulled: 0, error: 'Sin conexión' };

  let session;
  try {
    session = await getSession();
  } catch {
    return { applied: 0, pulled: 0, error: 'Error al obtener sesión' };
  }

  if (!session?.user?.id) {
    return { applied: 0, pulled: 0, error: 'No autenticado' };
  }

  // 1. Leer operaciones pendientes locales
  const pendingOps = await getPendingSyncOperations();
  if (pendingOps.length === 0 && !getLastSyncAt()) {
    // No hay nada pendiente ni sync previo
    return { applied: 0, pulled: 0 };
  }

  const payload: {
    operations: { table: string; operation: string; recordId: string; payload: any }[];
    lastSyncAt?: string;
  } = {
    operations: pendingOps.map((op) => ({
      table: op.tableName,
      operation: op.operation,
      recordId: op.id,
      payload: JSON.parse(op.payload),
    })),
  };

  const lastSync = getLastSyncAt();
  if (lastSync) payload.lastSyncAt = lastSync;

  // 2. Enviar a /api/sync
  let response: Response;
  try {
    response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    return { applied: 0, pulled: 0, error: 'Error de red al conectar con el servidor' };
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Error desconocido' }));
    return { applied: 0, pulled: 0, error: body.error || `HTTP ${response.status}` };
  }

  const result = await response.json();

  // 3. Aplicar cambios del servidor en SQLite local
  if (result.updates && result.updates.length > 0) {
    await applyServerUpdates(result.updates);
  }

  // 4. Marcar operaciones como sincronizadas
  if (pendingOps.length > 0) {
    await markSynced(pendingOps.map((op) => op.id));
  }

  // 5. Guardar timestamp
  setLastSyncAt(new Date().toISOString());

  return { applied: result.applied || 0, pulled: result.updates?.length || 0 };
}

async function applyServerUpdates(
  updates: { table: string; record: Record<string, unknown> }[],
): Promise<void> {
  const localDb = await import('./localDb');

  for (const { table, record } of updates) {
    try {
      switch (table) {
        case 'products':
          await localDb.saveProduct(record as any);
          break;
        case 'movements': {
          const items = (record as any).items || [];
          await localDb.saveMovement({ ...record, items } as any);
          break;
        }
        case 'customers':
          await localDb.saveCustomer(record as any);
          break;
        case 'accounts':
          await localDb.saveAccount(record as any);
          break;
      }
    } catch (err) {
      console.warn(`[sync] Error aplicando update en ${table}:`, err);
    }
  }
}

// â”€â”€â”€ Contar operaciones pendientes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getPendingCount(): Promise<number> {
  try {
    const ops = await getPendingSyncOperations();
    return ops.length;
  } catch {
    return 0;
  }
}
