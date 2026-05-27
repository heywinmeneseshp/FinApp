import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import { generateId } from './generate-id';

// â”€â”€â”€ Tipos compartidos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface LocalProduct {
  id: string; name: string; stock: number; price: number; cost: number;
  minStock?: number; category?: string; unit?: string;
  createdAt: string; updatedAt: string;
}

export interface LocalMovement {
  id: string; type: 'ingreso' | 'gasto'; amount: number;
  category: string; description: string; date: string;
  accountId?: string; customerId?: string; supplierId?: string;
  paymentMethod?: string; items?: LocalMovementItem[];
  createdAt: string; updatedAt: string;
}

export interface LocalMovementItem {
  id: string; movementId: string; productId?: string;
  quantity: number; price: number; cost: number;
}

export interface LocalCustomer {
  id: string; name: string; email: string; phone: string;
  acceptedReceipt: boolean; acceptedPromotions: boolean;
  lastUpdated: string; createdAt: string; updatedAt: string;
}

export interface LocalAccount {
  id: string; name: string; type: 'cash' | 'bank' | 'savings' | 'other';
  initialBalance: number; color: string;
  createdAt: string; updatedAt: string;
}

export interface LocalSyncOp {
  id: string; tableName: string; operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string; synced: number;
  createdAt: string;
}

// â”€â”€â”€ Queries DDL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DDL = [
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, stock REAL DEFAULT 0,
    price REAL DEFAULT 0, cost REAL DEFAULT 0,
    min_stock REAL DEFAULT 5, category TEXT DEFAULT '', unit TEXT DEFAULT 'Unidad',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'cash', initial_balance REAL DEFAULT 0,
    color TEXT DEFAULT '#12C2A2',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS movements (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, amount REAL NOT NULL,
    category TEXT DEFAULT '', description TEXT DEFAULT '',
    date TEXT NOT NULL, account_id TEXT, customer_id TEXT, supplier_id TEXT,
    payment_method TEXT DEFAULT 'cash',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS movement_items (
    id TEXT PRIMARY KEY, movement_id TEXT NOT NULL,
    product_id TEXT, quantity REAL DEFAULT 1, price REAL DEFAULT 0, cost REAL DEFAULT 0,
    FOREIGN KEY (movement_id) REFERENCES movements(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT DEFAULT '',
    phone TEXT DEFAULT '', accepted_receipt INTEGER DEFAULT 0,
    accepted_promotions INTEGER DEFAULT 0, last_updated TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS accounts_payable (
    id TEXT PRIMARY KEY, supplier_id TEXT, supplier_name TEXT NOT NULL,
    amount REAL NOT NULL, paid_amount REAL DEFAULT 0,
    date TEXT NOT NULL, due_date TEXT, status TEXT DEFAULT 'pending',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS accounts_receivable (
    id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT NOT NULL,
    amount REAL NOT NULL, paid_amount REAL DEFAULT 0,
    date TEXT NOT NULL, due_date TEXT, status TEXT DEFAULT 'pending',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS lesson_progress (
    id TEXT PRIMARY KEY, lesson_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending', progress INTEGER DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY, table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('INSERT','UPDATE','DELETE')),
    payload TEXT NOT NULL, synced INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced)`,
];

function now(): string {
  return new Date().toISOString();
}

// â”€â”€â”€ Web fallback (in-memory) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class WebFallbackDB {
  private data: Map<string, Map<string, any>> = new Map();

  private table(name: string): Map<string, any> {
    if (!this.data.has(name)) this.data.set(name, new Map());
    return this.data.get(name)!;
  }

  async execute(_sql: string): Promise<void> {}
  async run(sql: string, params?: any[]): Promise<{ changes: { changes: number } }> {
    if (!params) return { changes: { changes: 0 } };
    const tableMatch = sql.match(/(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+)?(\w+)/i);
    if (!tableMatch) return { changes: { changes: 0 } };
    const tableName = tableMatch[1];
    const tbl = this.table(tableName);

    if (sql.toUpperCase().startsWith('INSERT')) {
      const keyCol = params[0];
      tbl.set(keyCol, {});
      return { changes: { changes: 1 } };
    }
    if (sql.toUpperCase().startsWith('DELETE')) {
      const keyCol = params[0];
      tbl.delete(keyCol);
      return { changes: { changes: 1 } };
    }
    if (sql.toUpperCase().startsWith('UPDATE')) {
      return { changes: { changes: 1 } };
    }
    return { changes: { changes: 0 } };
  }

  async query(sql: string, params?: any[]): Promise<{ values: any[] }> {
    const tableMatch = sql.match(/\bFROM\s+(\w+)/i);
    if (!tableMatch) return { values: [] };
    const tableName = tableMatch[1];
    const tbl = this.table(tableName);
    return { values: Array.from(tbl.values()) };
  }

  async close(): Promise<void> {
    this.data.clear();
  }
}

// â”€â”€â”€ Driver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type QueryFn = (sql: string, params?: any[]) => Promise<{ values: any[] }>;
type RunFn = (sql: string, params?: any[]) => Promise<{ changes: { changes: number } }>;
type ExecFn = (sql: string) => Promise<void>;
type CloseFn = () => Promise<void>;

let driver: { query: QueryFn; run: RunFn; execute: ExecFn; close: CloseFn } | null = null;
let initialized = false;

async function getDriver() {
  if (driver) return driver;

  const isCapacitor =
    typeof window !== 'undefined' &&
    (window as any).Capacitor?.isPluginAvailable?.('CapacitorSQLite');

  if (isCapacitor) {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const db: SQLiteDBConnection = await sqlite.createConnection(
      'finapp', false, 'no-encryption', 1, false,
    );
    await db.open();
    driver = {
      query: async (sql, p) => {
        const result = await db.query(sql, p);
        return { values: result.values ?? [] };
      },
      run: async (sql, p) => {
        const result = await db.run(sql, p);
        return { changes: { changes: result.changes?.changes ?? 0 } };
      },
      execute: async (sql) => { await db.execute(sql); },
      close: async () => { await db.close(); await sqlite.closeAllConnections(); },
    };
  } else {
    const fb = new WebFallbackDB();
    driver = {
      query: (sql, p) => fb.query(sql, p),
      run: (sql, p) => fb.run(sql, p),
      execute: (sql) => fb.execute(sql),
      close: () => fb.close(),
    };
    console.warn('[localDb] Usando fallback en memoria - instala en dispositivo real para SQLite nativo.');
  }

  return driver;
}

export async function initializeDatabase(): Promise<void> {
  if (initialized) return;
  const d = await getDriver();
  for (const ddl of DDL) {
    await d.execute(ddl);
  }
  initialized = true;
}

export async function closeDatabase(): Promise<void> {
  if (!driver) return;
  await driver.close();
  driver = null;
  initialized = false;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function all(table: string, order = 'created_at DESC'): Promise<any[]> {
  const d = await getDriver();
  const res = await d.query(`SELECT * FROM ${table} ORDER BY ${order}`);
  return res.values || [];
}

async function getById(table: string, id: string): Promise<any | null> {
  const d = await getDriver();
  const res = await d.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return (res.values?.[0]) || null;
}

async function insert(table: string, data: Record<string, any>): Promise<void> {
  const d = await getDriver();
  const keys = Object.keys(data);
  const vals = Object.values(data);
  const cols = keys.join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  await d.run(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, vals);
}

async function updateById(table: string, id: string, data: Record<string, any>): Promise<void> {
  const d = await getDriver();
  const keys = Object.keys(data);
  const vals = Object.values(data);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  await d.run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, [...vals, id]);
}

async function removeById(table: string, id: string): Promise<void> {
  const d = await getDriver();
  await d.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

function wrap<T extends Record<string, any>>(row: T | null): T | null {
  return row;
}

// â”€â”€â”€ CRUD: Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getProducts(): Promise<LocalProduct[]> {
  const rows = await all('products');
  return rows.map(mapProduct);
}

export async function getProduct(id: string): Promise<LocalProduct | null> {
  return wrap(mapProduct(await getById('products', id)));
}

export async function saveProduct(data: Partial<LocalProduct> & { id: string }): Promise<void> {
  const existing = await getById('products', data.id);
  const ts = now();
  if (existing) {
    await updateById('products', data.id, { ...data, updated_at: ts });
  } else {
    await insert('products', { ...data, created_at: ts, updated_at: ts });
  }
  await enqueueSync('products', existing ? 'UPDATE' : 'INSERT', data.id, data);
}

export async function deleteProduct(id: string): Promise<void> {
  await enqueueSync('products', 'DELETE', id, { id });
  await removeById('products', id);
}

function mapProduct(r: any): LocalProduct {
  return r ? {
    id: r.id, name: r.name, stock: r.stock, price: r.price, cost: r.cost,
    minStock: r.min_stock, category: r.category, unit: r.unit,
    createdAt: r.created_at, updatedAt: r.updated_at,
  } : r;
}

// â”€â”€â”€ CRUD: Accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getAccounts(): Promise<LocalAccount[]> {
  return (await all('accounts')).map(mapAccount);
}

export async function getAccount(id: string): Promise<LocalAccount | null> {
  return wrap(mapAccount(await getById('accounts', id)));
}

export async function saveAccount(data: Partial<LocalAccount> & { id: string }): Promise<void> {
  const existing = await getById('accounts', data.id);
  const ts = now();
  if (existing) {
    await updateById('accounts', data.id, { ...data, updated_at: ts });
  } else {
    await insert('accounts', {
      id: data.id, name: data.name, type: data.type,
      initial_balance: data.initialBalance, color: data.color,
      created_at: ts, updated_at: ts,
    });
  }
  await enqueueSync('accounts', existing ? 'UPDATE' : 'INSERT', data.id, data);
}

export async function deleteAccount(id: string): Promise<void> {
  await enqueueSync('accounts', 'DELETE', id, { id });
  await removeById('accounts', id);
}

function mapAccount(r: any): LocalAccount {
  return r ? {
    id: r.id, name: r.name, type: r.type,
    initialBalance: r.initial_balance, color: r.color,
    createdAt: r.created_at, updatedAt: r.updated_at,
  } : r;
}

// â”€â”€â”€ CRUD: Movements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getMovements(filters?: {
  type?: string; startDate?: string; endDate?: string;
}): Promise<LocalMovement[]> {
  const d = await getDriver();
  let sql = 'SELECT * FROM movements WHERE 1=1';
  const params: any[] = [];
  if (filters?.type) { sql += ' AND type = ?'; params.push(filters.type); }
  if (filters?.startDate) { sql += ' AND date >= ?'; params.push(filters.startDate); }
  if (filters?.endDate) { sql += ' AND date <= ?'; params.push(filters.endDate + 'T23:59:59'); }
  sql += ' ORDER BY date DESC';

  const res = await d.query(sql, params);
  const rows = res.values || [];
  const itemsPromises = rows.map(async (r: any) => {
    const itemsRes = await d.query(
      'SELECT * FROM movement_items WHERE movement_id = ?', [r.id],
    );
    return { ...mapMovement(r), items: (itemsRes.values || []).map(mapMovementItem) };
  });
  return Promise.all(itemsPromises);
}

export async function getMovement(id: string): Promise<LocalMovement | null> {
  const row = await getById('movements', id);
  if (!row) return null;
  const d = await getDriver();
  const itemsRes = await d.query('SELECT * FROM movement_items WHERE movement_id = ?', [id]);
  return { ...mapMovement(row), items: (itemsRes.values || []).map(mapMovementItem) };
}

export async function saveMovement(
  data: Partial<LocalMovement> & { id: string },
): Promise<void> {
  const existing = await getById('movements', data.id);
  const ts = now();
  const row = {
    id: data.id, type: data.type, amount: data.amount,
    category: data.category || '', description: data.description || '',
    date: data.date || ts,
    account_id: data.accountId || null,
    customer_id: data.customerId || null,
    supplier_id: data.supplierId || null,
    payment_method: data.paymentMethod || 'cash',
  };
  if (existing) {
    await updateById('movements', data.id, { ...row, updated_at: ts });
  } else {
    await insert('movements', { ...row, created_at: ts, updated_at: ts });
  }

  // Items: delete + re-insert
  if (data.items) {
    await d().then(async (d) => {
      await d.run('DELETE FROM movement_items WHERE movement_id = ?', [data.id]);
      for (const item of data.items!) {
        await insert('movement_items', {
          id: item.id || generateId(), movement_id: data.id,
          product_id: item.productId || null, quantity: item.quantity,
          price: item.price, cost: item.cost || 0,
        });
      }
    });
  }

  await enqueueSync('movements', existing ? 'UPDATE' : 'INSERT', data.id, data);
}

export async function deleteMovement(id: string): Promise<void> {
  await enqueueSync('movements', 'DELETE', id, { id });
  await d().then(async (d) => {
    await d.run('DELETE FROM movement_items WHERE movement_id = ?', [id]);
  });
  await removeById('movements', id);
}

function mapMovement(r: any): LocalMovement {
  return r ? {
    id: r.id, type: r.type, amount: r.amount,
    category: r.category, description: r.description, date: r.date,
    accountId: r.account_id, customerId: r.customer_id,
    supplierId: r.supplier_id, paymentMethod: r.payment_method,
    items: [], createdAt: r.created_at, updatedAt: r.updated_at,
  } : r;
}

function mapMovementItem(r: any): LocalMovementItem {
  return r ? {
    id: r.id, movementId: r.movement_id, productId: r.product_id,
    quantity: r.quantity, price: r.price, cost: r.cost,
  } : r;
}

// â”€â”€â”€ CRUD: Customers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getCustomers(): Promise<LocalCustomer[]> {
  return (await all('customers', 'name ASC')).map(mapCustomer);
}

export async function getCustomer(id: string): Promise<LocalCustomer | null> {
  return wrap(mapCustomer(await getById('customers', id)));
}

export async function saveCustomer(data: Partial<LocalCustomer> & { id: string }): Promise<void> {
  const existing = await getById('customers', data.id);
  const ts = now();
  if (existing) {
    await updateById('customers', data.id, {
      name: data.name, email: data.email, phone: data.phone,
      accepted_receipt: data.acceptedReceipt ? 1 : 0,
      accepted_promotions: data.acceptedPromotions ? 1 : 0,
      last_updated: ts, updated_at: ts,
    });
  } else {
    await insert('customers', {
      id: data.id, name: data.name, email: data.email || '',
      phone: data.phone || '',
      accepted_receipt: data.acceptedReceipt ? 1 : 0,
      accepted_promotions: data.acceptedPromotions ? 1 : 0,
      last_updated: ts, created_at: ts, updated_at: ts,
    });
  }
  await enqueueSync('customers', existing ? 'UPDATE' : 'INSERT', data.id, data);
}

export async function deleteCustomer(id: string): Promise<void> {
  await enqueueSync('customers', 'DELETE', id, { id });
  await removeById('customers', id);
}

function mapCustomer(r: any): LocalCustomer {
  return r ? {
    id: r.id, name: r.name, email: r.email, phone: r.phone,
    acceptedReceipt: !!r.accepted_receipt,
    acceptedPromotions: !!r.accepted_promotions,
    lastUpdated: r.last_updated, createdAt: r.created_at, updatedAt: r.updated_at,
  } : r;
}

// â”€â”€â”€ Sync Queue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function d() {
  return getDriver();
}

async function enqueueSync(
  tableName: string, operation: 'INSERT' | 'UPDATE' | 'DELETE',
  recordId: string, payload: any,
): Promise<void> {
  const existingOps = await d().then(async (drv) => {
    const res = await drv.query(
      `SELECT id FROM sync_queue WHERE table_name = ? AND operation = ? AND synced = 0 AND payload LIKE ?`,
      [tableName, operation, `%"id":"${recordId}"%`],
    );
    return res.values || [];
  });

  if (existingOps.length > 0) return;

  await insert('sync_queue', {
    id: generateId(), table_name: tableName, operation,
    payload: JSON.stringify(payload), synced: 0, created_at: now(),
  });
}

export async function getPendingSyncOperations(): Promise<LocalSyncOp[]> {
  const d = await getDriver();
  const res = await d.query(
    'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC',
  );
  return (res.values || []).map((r: any) => ({
    id: r.id, tableName: r.table_name, operation: r.operation,
    payload: r.payload, synced: r.synced, createdAt: r.created_at,
  }));
}

export async function markSynced(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const d = await getDriver();
  for (const id of ids) {
    await d.run('UPDATE sync_queue SET synced = 1 WHERE id = ?', [id]);
  }
}
