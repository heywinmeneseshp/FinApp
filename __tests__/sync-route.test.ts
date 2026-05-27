/**
 * @jest-environment node
 */

import { POST } from '@/app/api/sync/route';
import { query, getConnection } from '@/lib/db';
import { getSessionUserId } from '@/lib/api-helpers';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn(),
}));

jest.mock('@/lib/api-helpers', () => {
  const actual = jest.requireActual('@/lib/api-helpers');
  return {
    ...actual,
    getSessionUserId: jest.fn(),
  };
});

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedGetConnection = getConnection as jest.MockedFunction<typeof getConnection>;
const mockedGetSessionUserId = getSessionUserId as jest.MockedFunction<typeof getSessionUserId>;

describe('sync route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetSessionUserId.mockResolvedValue('user-1');
    mockedQuery.mockResolvedValue([]);
  });

  it('pulls server updates even when there are no local operations', async () => {
    mockedQuery.mockResolvedValueOnce([{ id: 'product-1', user_id: 'user-1' }]);

    const response = await POST(new Request('http://localhost/api/sync', {
      method: 'POST',
      body: JSON.stringify({ operations: [], lastSyncAt: '2026-01-01T00:00:00.000Z' }),
    }));

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.applied).toBe(0);
    expect(body.updates).toEqual([
      { table: 'products', record: { id: 'product-1', user_id: 'user-1' } },
    ]);
    expect(mockedQuery).toHaveBeenCalled();
  });

  it('adds user_id before building insert columns', async () => {
    const execute = jest.fn();
    mockedGetConnection.mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      execute,
    } as any);

    const response = await POST(new Request('http://localhost/api/sync', {
      method: 'POST',
      body: JSON.stringify({
        operations: [{
          table: 'products',
          operation: 'INSERT',
          recordId: 'product-1',
          payload: { id: 'product-1', name: 'Cafe', stock: 1, price: 10, cost: 5 },
        }],
      }),
    }));

    expect(response.status).toBe(200);
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('`user_id`'),
      expect.arrayContaining(['user-1']),
    );
  });
});
