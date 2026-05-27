import { query } from '@/lib/db';
import { getSessionUserId, ok, created, error, customerSchema, generateId } from '@/lib/api-helpers';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    const customers = await query<any[]>(
      `SELECT id, user_id AS userId, name, email, phone,
              accepted_receipt AS acceptedReceipt, accepted_promotions AS acceptedPromotions,
              last_updated AS lastUpdated, created_at AS createdAt, updated_at AS updatedAt
       FROM customers WHERE user_id = ? ORDER BY name ASC`,
      [userId],
    );
    return ok(customers);
  } catch (err) {
    return error(err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    const body = await request.json();
    const parsed = customerSchema.parse(body);

    const id = generateId();

    await query(
      `INSERT INTO customers (id, user_id, name, email, phone, accepted_receipt, accepted_promotions, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, userId, parsed.name, parsed.email, parsed.phone, parsed.acceptedReceipt, parsed.acceptedPromotions],
    );

    const [newCustomer] = await query<any[]>(
      `SELECT id, user_id AS userId, name, email, phone,
              accepted_receipt AS acceptedReceipt, accepted_promotions AS acceptedPromotions,
              last_updated AS lastUpdated, created_at AS createdAt, updated_at AS updatedAt
       FROM customers WHERE id = ?`,
      [id],
    );

    return created(newCustomer);
  } catch (err) {
    return error(err);
  }
}
