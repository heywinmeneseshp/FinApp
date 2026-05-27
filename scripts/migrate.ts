import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';

async function migrate() {
  // carga .env.local si existe, sino .env
  const envLocal = resolve(__dirname, '../.env.local');
  const envFile = resolve(__dirname, '../.env');

  try {
    readFileSync(envLocal);
    config({ path: envLocal });
  } catch {
    config({ path: envFile });
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'finapp';

  if (!user) {
    console.error('ERROR: DB_USER no está definido en .env / .env.local');
    process.exit(1);
  }

  const schemaPath = resolve(__dirname, '../database/schema.sql');
  const sql = readFileSync(schemaPath, 'utf-8');

  // conecta sin base de datos para poder crearla
  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true });

  try {
    console.log(`> Ejecutando schema.sql en ${host}:${port} como ${user}...`);
    await conn.query(sql);
    console.log(`OK Base de datos "${database}" lista (tablas creadas/actualizadas)`);
  } catch (err: any) {
    console.error('ERROR al ejecutar schema.sql:', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();
