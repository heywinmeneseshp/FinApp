import { z } from 'zod';
import { query, getConnection } from '@/lib/db';
import { getSessionUserId, ok, error } from '@/lib/api-helpers';

const operationSchema = z.object({
  table: z.enum([
    'products', 'movements', 'movement_items', 'customers',
    'suppliers', 'accounts', 'accounts_payable', 'accounts_receivable', 'lesson_progress',
  ]),
  operation: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  recordId: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

const syncRequestSchema = z.object({
  operations: z.array(operationSchema),
  lastSyncAt: z.string().optional(),
});

const TABLE_MAP: Record<string, string> = {
  products: 'products',
  movements: 'movements',
  movement_items: 'movement_items',
  customers: 'customers',
  suppliers: 'suppliers',
  accounts: 'accounts',
  accounts_payable: 'accounts_payable',
  accounts_receivable: 'accounts_receivable',
  lesson_progress: 'lesson_progress',
};

async function collectUpdates(userId: string, lastSyncAt?: string) {
  if (!lastSyncAt) return [];

  let updates: { table: string; record: Record<string, unknown> }[] = [];
  for (const table of Object.values(TABLE_MAP)) {
    if (table === 'movement_items') {
      const rows = await query<Record<string, unknown>[]>(
        `SELECT mi.* FROM movement_items mi
         JOIN movements m ON m.id = mi.movement_id
         WHERE m.user_id = ? AND m.updated_at > ?`,
        [userId, lastSyncAt],
      );
      updates = updates.concat(rows.map((record) => ({ table, record })));
      continue;
    }

    const rows = await query<Record<string, unknown>[]>(
      `SELECT * FROM \`${table}\` WHERE user_id = ? AND updated_at > ?`,
      [userId, lastSyncAt],
    );
    updates = updates.concat(rows.map((record) => ({ table, record })));
  }

  return updates;
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    const parsed = syncRequestSchema.parse(await request.json());

    if (parsed.operations.length === 0) {
      return ok({ applied: 0, updates: await collectUpdates(userId, parsed.lastSyncAt) });
    }

    const conn = await getConnection();
    try {
      await conn.beginTransaction();

      for (const op of parsed.operations) {
        const table = TABLE_MAP[op.table];
        const { recordId, operation, payload } = op;

        if (operation === 'DELETE') {
          if (table === 'movement_items') {
            await conn.execute(
              `DELETE mi FROM movement_items mi
               JOIN movements m ON m.id = mi.movement_id
               WHERE mi.id = ? AND m.user_id = ?`,
              [recordId, userId],
            );
          } else {
            await conn.execute(
              `DELETE FROM \`${table}\` WHERE id = ? AND user_id = ?`,
              [recordId, userId],
            );
          }
          continue;
        }

        if (operation === 'INSERT') {
          const cols = Object.keys(payload);
          const vals: any[] = Object.values(payload);

          if (!payload.user_id && table !== 'movement_items') {
            cols.push('user_id');
            vals.push(userId);
          }

          const placeholders = cols.map(() => '?').join(', ');
          const colNames = cols.map((c) => '`' + c + '`').join(', ');
          const updateClause = cols
            .filter((c) => c !== 'id' && c !== 'user_id')
            .map((c) => '`' + c + '` = VALUES(`' + c + '`)')
            .join(', ');

          await conn.execute(
            `INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})
             ON DUPLICATE KEY UPDATE ${updateClause || '`id` = `id`'}`,
            vals,
          );
        }

        if (operation === 'UPDATE') {
          const cols = Object.keys(payload).filter((col) => col !== 'id' && col !== 'user_id');
          if (cols.length === 0) continue;

          const vals: any[] = cols.map((col) => payload[col]);

          if (table === 'movement_items') {
            await conn.execute(
              `UPDATE movement_items mi
               JOIN movements m ON m.id = mi.movement_id
               SET ${cols.map((c) => `mi.\`${c}\` = ?`).join(', ')}
               WHERE mi.id = ? AND m.user_id = ?`,
              [...vals, recordId, userId],
            );
          } else {
            await conn.execute(
              `UPDATE \`${table}\`
               SET ${cols.map((c) => '`' + c + '` = ?').join(', ')}
               WHERE id = ? AND user_id = ?`,
              [...vals, recordId, userId],
            );
          }
        }
      }

      await conn.commit();

      return ok({
        applied: parsed.operations.length,
        updates: await collectUpdates(userId, parsed.lastSyncAt),
      });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    return error(err);
  }
}
