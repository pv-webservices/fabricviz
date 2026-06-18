import { describe, it, expect, vi } from 'vitest';
import { updateSettings } from '../services/settings-service';
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

describe('Settings Service', () => {
  it('should process bulk updates within a transaction', async () => {
    mockQuery.mockResolvedValue({ rows: [] }); // For the SELECT old value query
    
    await updateSettings(mockPool, { site_name: 'New Name', history_limit: '50' }, 'admin-123');

    // Expected sequence: BEGIN, SELECT, INSERT/UPDATE, SELECT, INSERT/UPDATE, COMMIT
    expect(mockQuery).toHaveBeenNthCalledWith(1, 'BEGIN');
    
    // First key: site_name
    expect(mockQuery).toHaveBeenNthCalledWith(2, 'SELECT value FROM app_settings WHERE key = $1', ['site_name']);
    expect(mockQuery.mock.calls[2][0]).toContain('INSERT INTO app_settings');
    expect(mockQuery.mock.calls[2][1]).toEqual(['site_name', 'New Name', 'admin-123']);
    
    // Second key: history_limit
    expect(mockQuery).toHaveBeenNthCalledWith(4, 'SELECT value FROM app_settings WHERE key = $1', ['history_limit']);
    expect(mockQuery.mock.calls[4][0]).toContain('INSERT INTO app_settings');
    expect(mockQuery.mock.calls[4][1]).toEqual(['history_limit', '50', 'admin-123']);

    expect(mockQuery).toHaveBeenLastCalledWith('COMMIT');
    expect(mockRelease).toHaveBeenCalled();
  });
});
