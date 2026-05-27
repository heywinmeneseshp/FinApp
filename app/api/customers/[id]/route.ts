import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUserId, ok, error, customerSchema, NotFoundError, generateId } from '@/lib/api-helpers';

async function getOwnedCustomer(userId: string, id: string) {
  const customers = await query<any[]>(
    `SELECT id, user_id AS userId, name, email, phone,
            accepted_receipt AS acceptedReceipt, accepted_promotions AS acceptedPromotions,
            last_updated AS lastUpdated, created_at AS createdAt, updated_at AS updatedAt
     FROM customers WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  if (!customers[0]) throw new NotFoundError('Cliente no encontrado');
  return customers[0];
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    const { id } = await params;
    await getOwnedCustomer(userId, id);

    const body = await request.json();
    const parsed = customerSchema.parse(body);

    await query(
      `UPDATE customers SET name = ?, email = ?, phone = ?, accepted_receipt = ?, accepted_promotions = ?, last_updated = NOW()
       WHERE id = ? AND user_id = ?`,
      [parsed.name, parsed.email, parsed.phone, parsed.acceptedReceipt, parsed.acceptedPromotions, id, userId],
    );

    const updated = await getOwnedCustomer(userId, id);
    return ok(updated);
  } catch (err) {
    return error(err);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    const { id } = await params;
    await getOwnedCustomer(userId, id);

    await query('DELETE FROM customers WHERE id = ? AND user_id = ?', [id, userId]);
    return ok({ deleted: true });
  } catch (err) {
    return error(err);
  }
}
