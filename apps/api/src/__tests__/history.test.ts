import { describe, it, expect, vi } from 'vitest';
import { getHistory } from '../services/history-service';
import { Pool } from 'pg';

// Mock the PG Pool
const mockQuery = vi.fn();
const mockPool = {
  query: mockQuery,
} as unknown as Pool;

describe('History Service', () => {
  it('should fetch all history for admin when no accessCodeId is provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }] }); // Count query
    mockQuery.mockResolvedValueOnce({ rows: [{ id: '1', object_type: 'sofa' }] }); // Data query

    const result = await getHistory(mockPool, { page: 1, limit: 10 });
    
    // The WHERE clause should only contain 'v.active = true'
    expect(mockQuery.mock.calls[0][0]).toContain('WHERE v.active = true');
    expect(mockQuery.mock.calls[0][1]).toEqual([]);
    
    expect(result.total).toBe(5);
    expect(result.items.length).toBe(1);
  });

  it('should filter history by accessCodeId for customer', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '2' }] });
    mockQuery.mockResolvedValueOnce({ rows: [{ id: '2', object_type: 'curtain' }] });

    const result = await getHistory(mockPool, { accessCodeId: 'test-uuid', page: 1, limit: 10 });

    // The WHERE clause should contain both active and access_code_id filters
    expect(mockQuery.mock.calls[2][0]).toContain('WHERE v.active = true AND v.access_code_id = $1');
    expect(mockQuery.mock.calls[2][1]).toEqual(['test-uuid']);
    
    expect(result.total).toBe(2);
  });
});
