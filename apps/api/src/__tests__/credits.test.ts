import { describe, it, expect, vi } from 'vitest';
import { grantCredits } from '../services/credit-service';
import { Pool, PoolClient } from 'pg';

const mockQuery = vi.fn();
const mockRelease = vi.fn();

const mockClient = {
  query: mockQuery,
  release: mockRelease,
} as unknown as PoolClient;

const mockPool = {
  connect: vi.fn().mockResolvedValue(mockClient),
} as unknown as Pool;

describe('Credit Service', () => {
  it('should grant credits and update limit inside a transaction', async () => {
    mockQuery.mockResolvedValueOnce({}); // BEGIN
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'tx-1' }] }); // INSERT tx
    mockQuery.mockResolvedValueOnce({ rows: [{ credit_limit: 150 }] }); // UPDATE limit
    mockQuery.mockResolvedValueOnce({}); // INSERT audit log
    mockQuery.mockResolvedValueOnce({}); // COMMIT

    await grantCredits(mockPool, 'ac-123', 50, 'Pilot batch', 'admin-123');

    expect(mockQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
    
    // Check tx insert
    expect(mockQuery.mock.calls[1][0]).toContain('INSERT INTO credit_transactions');
    expect(mockQuery.mock.calls[1][1]).toEqual(['ac-123', 50, 'Pilot batch', 'admin-123']);
    
    // Check limit update
    expect(mockQuery.mock.calls[2][0]).toContain('UPDATE access_codes');
    expect(mockQuery.mock.calls[2][1]).toEqual([50, 'ac-123']);

    expect(mockQuery).toHaveBeenNthCalledWith(5, 'COMMIT');
    expect(mockRelease).toHaveBeenCalled();
  });
});
