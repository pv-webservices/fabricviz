import { Pool } from 'pg';

export interface CustomerUsageWarning {
  id: string;
  customer_name: string;
  company_name: string;
  credits_used: number;
  credit_limit: number;
  percentage_used: number;
}

export async function getCustomerUsageStats(db: Pool) {
  // Aggregate stats: last login, render count (tracked natively in access_codes), 
  // history count (via visualizations), and credit limits.
  const query = `
    SELECT 
      a.id, a.code, a.customer_name, a.company_name, a.phone,
      a.active, a.render_count, a.credit_limit, a.credits_used,
      a.created_at, a.last_used_at,
      COUNT(v.id) as history_count
    FROM access_codes a
    LEFT JOIN visualizations v ON a.id = v.access_code_id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `;

  const result = await db.query(query);
  return result.rows;
}

export async function getCustomerWarnings(db: Pool): Promise<CustomerUsageWarning[]> {
  const query = `
    SELECT 
      id, customer_name, company_name, credits_used, credit_limit,
      (credits_used::float / NULLIF(credit_limit, 0)) * 100 as percentage_used
    FROM access_codes
    WHERE active = true AND credit_limit > 0
      AND (credits_used::float / credit_limit) >= 0.9
    ORDER BY percentage_used DESC
  `;

  const result = await db.query(query);
  return result.rows;
}
