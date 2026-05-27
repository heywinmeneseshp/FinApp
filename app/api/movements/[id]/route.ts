import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { getSessionUserId, ok, error, NotFoundError } from '@/lib/api-helpers';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId();
    const { id } = await params;

    const existing = await query<any[]>(
      'SELECT id FROM movements WHERE id = ? AND user_id = ?',
      [id, userId],
    );
    if (!existing[0]) throw new NotFoundError('Movimiento no encontrado');

    await query('DELETE FROM movement_items WHERE movement_id = ?', [id]);
    await query('DELETE FROM movements WHERE id = ? AND user_id = ?', [id, userId]);

    return ok({ deleted: true });
  } catch (err) {
    return error(err);
  }
}
