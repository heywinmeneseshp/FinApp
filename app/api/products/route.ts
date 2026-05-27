import { query } from '@/lib/db';
import { getSessionUserId, ok, created, error, productSchema, generateId } from '@/lib/api-helpers';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    const products = await query<any[]>(
      'SELECT id, name, stock, price, cost, min_stock AS minStock, category, unit, created_at AS createdAt, updated_at AS updatedAt FROM products WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
    );
    return ok(products);
  } catch (err) {
    return error(err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    const body = await request.json();
    const parsed = productSchema.parse(body);

    const id = generateId();

    await query(
      `INSERT INTO products (id, user_id, name, stock, price, cost, min_stock, category, unit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, parsed.name, parsed.stock, parsed.price, parsed.cost, parsed.minStock, parsed.category, parsed.unit],
    );

    const [newProduct] = await query<any[]>(
      'SELECT id, name, stock, price, cost, min_stock AS minStock, category, unit, created_at AS createdAt, updated_at AS updatedAt FROM products WHERE id = ?',
      [id],
    );

    return created(newProduct);
  } catch (err) {
    return error(err);
  }
}
