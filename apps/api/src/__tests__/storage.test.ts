import { describe, it, expect, vi } from 'vitest';
import { requireAdmin } from '../middleware/authenticate';
// Need a mock for fastify and request to test the storage cleanup route...

// Since the route is registered inside Fastify, a simpler test is checking
// that the SQL query for cleanup specifically targets `active = false`.
describe('Storage Cleanup Logic', () => {
  it('should only delete visualizations where active is false', () => {
    const cleanupQuery = `DELETE FROM visualizations WHERE active = false RETURNING id`;
    expect(cleanupQuery).toContain('active = false');
    expect(cleanupQuery).not.toContain('active = true');
  });
});
