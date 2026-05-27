import { query } from '@/lib/db';
import { getSessionUserId, ok, created, error, movementSchema, generateId } from '@/lib/api-helpers';

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    let sql = `SELECT id, user_id AS userId, type, amount, category, description, date,
                      account_id AS accountId, customer_id AS customerId, supplier_id AS supplierId,
                      payment_method AS paymentMethod, created_at AS createdAt, updated_at AS updatedAt
               FROM movements WHERE user_id = ?`;
    const params: any[] = [userId];

    if (type && (type === 'ingreso' || type === 'gasto')) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate + ' 23:59:59');
    }

    sql += ' ORDER BY date DESC';

    const movements = await query<any[]>(sql, params);

    const itemsPromises = movements.map(async (m: any) => {
      const items = await query<any[]>(
        'SELECT id, movement_id AS movementId, product_id AS productId, quantity, price, cost FROM movement_items WHERE movement_id = ?',
        [m.id],
      );
      return { ...m, items };
    });

    return ok(await Promise.all(itemsPromises));
  } catch (err) {
    return error(err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    const body = await request.json();
    const parsed = movementSchema.parse(body);

    const id = generateId();
    const now = parsed.date || new Date().toISOString();

    await query(
      `INSERT INTO movements (id, user_id, type, amount, category, description, date, account_id, customer_id, supplier_id, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, parsed.type, parsed.amount, parsed.category,
        parsed.description, now, parsed.accountId || null,
        parsed.customerId || null, parsed.supplierId || null, parsed.paymentMethod,
      ],
    );

    if (parsed.items && parsed.items.length > 0) {
      for (const item of parsed.items) {
        await query(
          `INSERT INTO movement_items (id, movement_id, product_id, quantity, price, cost) VALUES (?, ?, ?, ?, ?, ?)`,
          [generateId(), id, item.productId, item.quantity, item.price, item.cost],
        );
      }
    }

    const [newMovement] = await query<any[]>(
      `SELECT id, user_id AS userId, type, amount, category, description, date,
              account_id AS accountId, customer_id AS customerId, supplier_id AS supplierId,
              payment_method AS paymentMethod, created_at AS createdAt, updated_at AS updatedAt
       FROM movements WHERE id = ?`,
      [id],
    );

    return created(newMovement);
  } catch (err) {
    return error(err);
  }
}
