import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUserId, ok, error, productSchema, NotFoundError } from '@/lib/api-helpers';

async function getOwnedProduct(userId: string, id: string) {
  const products = await query<any[]>(
    'SELECT id, name, stock, price, cost, min_stock AS minStock, category, unit, created_at AS createdAt, updated_at AS updatedAt FROM products WHERE id = ? AND user_id = ?',
    [id, userId],
  );
  if (!products[0]) throw new NotFoundError('Producto no encontrado');
  return products[0];
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    const { id } = await params;
    await getOwnedProduct(userId, id);

    const body = await request.json();
    const parsed = productSchema.parse(body);

    await query(
      `UPDATE products SET name = ?, stock = ?, price = ?, cost = ?, min_stock = ?, category = ?, unit = ? WHERE id = ? AND user_id = ?`,
      [parsed.name, parsed.stock, parsed.price, parsed.cost, parsed.minStock, parsed.category, parsed.unit, id, userId],
    );

    const updated = await getOwnedProduct(userId, id);
    return ok(updated);
  } catch (err) {
    return error(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    const { id } = await params;
    await getOwnedProduct(userId, id);

    await query('DELETE FROM products WHERE id = ? AND user_id = ?', [id, userId]);
    return ok({ deleted: true });
  } catch (err) {
    return error(err);
  }
}
