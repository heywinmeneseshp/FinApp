import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (pool) return pool;

  // Importante: Estas variables NUNCA deben tener prefijo NEXT_PUBLIC_
  // pues exponen credenciales en el bundle del cliente.
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const name = process.env.DB_NAME;

  if (!host || !user || !name) {
    // En build / SSR sin .env no lanzamos error para permitir static generation.
    // El error real aparecerá al invocar el endpoint en runtime.
    console.warn(
      '[db] MySQL no configurado. Define DB_HOST, DB_USER, DB_PASSWORD, DB_NAME en .env',
    );
    // pool dummy que falla en tiempo de ejecución
    pool = {} as mysql.Pool;
    return pool;
  }

  pool = mysql.createPool({
    host,
    port: Number(process.env.DB_PORT) || 3306,
    user,
    password: password || '',
    database: name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });

  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const p = getPool();
  if (!p.execute) {
    throw new Error(
      'MySQL no está configurado. Define DB_HOST, DB_USER, DB_PASSWORD, DB_NAME en .env',
    );
  }
  const [rows] = await p.execute(sql, params);
  return rows as T;
}

export async function getConnection() {
  const p = getPool();
  if (!p.getConnection) {
    throw new Error(
      'MySQL no está configurado. Define DB_HOST, DB_USER, DB_PASSWORD, DB_NAME en .env',
    );
  }
  return p.getConnection();
}

export function isConfigured(): boolean {
  return !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
}
