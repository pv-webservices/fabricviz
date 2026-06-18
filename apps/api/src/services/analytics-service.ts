import { Pool } from 'pg';
import type { TrackEventInput } from '../validators/analytics-validators';

export async function trackEvent(
  db: Pool,
  data: TrackEventInput,
  accessCodeId?: string,
): Promise<void> {
  await db.query(
    `INSERT INTO analytics_events (event_name, access_code_id, fabric_id, collection_id, visualization_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      data.eventName,
      accessCodeId ?? null,
      data.fabricId ?? null,
      data.collectionId ?? null,
      data.visualizationId ?? null,
      JSON.stringify(data.metadata ?? {}),
    ],
  );
}

export async function getAnalyticsDashboard(db: Pool) {
  // 1. Basic Counts
  const [visCount, activeUsersCount, eventsCount] = await Promise.all([
    db.query<{ count: string }>(`SELECT COUNT(*) as count FROM visualizations`),
    db.query<{ count: string }>(`SELECT COUNT(DISTINCT access_code_id) as count FROM customer_sessions WHERE expires_at > NOW()`),
    db.query<{ count: string }>(`SELECT COUNT(*) as count FROM analytics_events`),
  ]);

  // 2. Render Status Breakdown
  const statusRes = await db.query<{ status: string; count: string }>(`
    SELECT status, COUNT(*) as count 
    FROM render_jobs 
    GROUP BY status
  `);
  const renderStatusCounts = statusRes.rows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.count, 10);
    return acc;
  }, {} as Record<string, number>);

  // 3. Top Fabrics
  const topFabricsRes = await db.query<{ fabric_name: string; count: string }>(`
    SELECT f.name as fabric_name, COUNT(v.id) as count
    FROM visualizations v
    JOIN fabrics f ON v.fabric_id = f.id
    GROUP BY f.id, f.name
    ORDER BY count DESC
    LIMIT 5
  `);

  // 4. Trend Data (Last 7 Days)
  const trendRes = await db.query<{ date: string; count: string }>(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM visualizations
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  // 5. Company Bars
  const companyRes = await db.query<{ company_name: string; count: string }>(`
    SELECT a.company_name, COUNT(v.id) as count
    FROM visualizations v
    JOIN access_codes a ON v.access_code_id = a.id
    WHERE a.company_name IS NOT NULL
    GROUP BY a.company_name
    ORDER BY count DESC
    LIMIT 10
  `);

  // 6. City Breakdown
  const cityRes = await db.query<{ city: string; count: string }>(`
    SELECT a.city, COUNT(v.id) as count
    FROM visualizations v
    JOIN access_codes a ON v.access_code_id = a.id
    WHERE a.city IS NOT NULL
    GROUP BY a.city
    ORDER BY count DESC
    LIMIT 10
  `);

  // 7. Top Collections
  const colRes = await db.query<{ collection_name: string; count: string }>(`
    SELECT c.name as collection_name, COUNT(v.id) as count
    FROM visualizations v
    JOIN fabrics f ON v.fabric_id = f.id
    JOIN collections c ON f.collection_id = c.id
    GROUP BY c.id, c.name
    ORDER BY count DESC
    LIMIT 5
  `);

  return {
    totalVisualizations: parseInt(visCount.rows[0].count, 10),
    activeUsers: parseInt(activeUsersCount.rows[0].count, 10),
    totalEvents: parseInt(eventsCount.rows[0].count, 10),
    renderStatusCounts,
    topFabrics: topFabricsRes.rows.map(r => ({ name: r.fabric_name, count: parseInt(r.count, 10) })),
    topCollections: colRes.rows.map(r => ({ name: r.collection_name, count: parseInt(r.count, 10) })),
    companyBars: companyRes.rows.map(r => ({ name: r.company_name, count: parseInt(r.count, 10) })),
    cityBreakdown: cityRes.rows.map(r => ({ name: r.city, count: parseInt(r.count, 10) })),
    trendData: trendRes.rows.map(r => ({ date: r.date, count: parseInt(r.count, 10) })),
  };
}
