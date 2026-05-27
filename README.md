# FinApp Profesional

Aplicacion financiera para emprendedores, construida con Next.js, React, NextAuth,
MySQL y soporte offline para Capacitor/SQLite.

## Requisitos

- Node.js 20+
- MySQL o MariaDB
- Variables de entorno basadas en `.env.example`

## Desarrollo

1. Instala dependencias:
   `npm install`
2. Copia `.env.example` a `.env.local` y configura `DB_*`, `NEXTAUTH_SECRET`
   y `NEXTAUTH_URL`.
3. Crea o actualiza la base de datos:
   `npm run migrate`
4. Ejecuta la app:
   `npm run dev`

## Scripts

- `npm run dev`: servidor local de Next.js.
- `npm run build`: build de produccion.
- `npm run start`: servidor de produccion.
- `npm run lint`: revision ESLint.
- `npm test`: pruebas unitarias.
- `npm run migrate`: aplica `database/schema.sql` en MySQL/MariaDB.

## Notas

Los directorios `.next/`, `out/`, `node_modules/` y `coverage/` son generados y
no deben versionarse.
