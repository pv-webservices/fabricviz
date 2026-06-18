import { describe, it, expect, vi } from 'vitest';
import { getAnalyticsDashboard } from '../services/analytics-service';
import { Pool } from 'pg';

const mockQuery = vi.fn();
const mockPool = {
  query: mockQuery,
} as unknown as Pool;

describe('Analytics Dashboard Service', () => {
  it('should format dashboard aggregates correctly', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '100' }] }); // visCount
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '25' }] });  // activeUsers
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '500' }] }); // eventsCount
    
    mockQuery.mockResolvedValueOnce({ rows: [ // statusRes
      { status: 'completed', count: '90' },
      { status: 'failed', count: '10' }
    ]});
    
    mockQuery.mockResolvedValueOnce({ rows: [ // topFabrics
      { fabric_name: 'Velvet', count: '50' }
    ]});
    
    mockQuery.mockResolvedValueOnce({ rows: [ // trends
      { date: '2026-06-15', count: '10' }
    ]});

    const result = await getAnalyticsDashboard(mockPool);

    expect(result.totalVisualizations).toBe(100);
    expect(result.activeUsers).toBe(25);
    expect(result.totalEvents).toBe(500);
    expect(result.renderStatusCounts.completed).toBe(90);
    expect(result.renderStatusCounts.failed).toBe(10);
    expect(result.topFabrics[0].name).toBe('Velvet');
    expect(result.topFabrics[0].count).toBe(50);
    expect(result.trendData[0].date).toBe('2026-06-15');
    expect(result.trendData[0].count).toBe(10);
  });
});
