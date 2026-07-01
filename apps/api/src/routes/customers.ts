import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { requireAdmin } from '../middleware/authenticate';
import { getCustomerUsageStats, getCustomerWarnings } from '../services/customer-service';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default async function customerRoutes(fastify: FastifyInstance) {

  // ── GET /api/customers ─────────────────────────
  fastify.get(
    '/api/customers',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const stats = await getCustomerUsageStats(fastify.db);
      return reply.send(success(stats));
    }
  );

  // ── GET /api/customers/warnings ────────────────
  fastify.get(
    '/api/customers/warnings',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const warnings = await getCustomerWarnings(fastify.db);
      return reply.send(success(warnings));
    }
  );

  // ── GET /api/admin/customers ─────────────────────────
  fastify.get(
    '/api/admin/customers',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { search = '', page = '1', limit = '20', session_filter = 'all', status = 'all', tags = '' } = request.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT id, full_name, email, mobile, country_code, company, city, is_active, created_at, session_count, last_active_at, tags
        FROM customers
        WHERE deleted_at IS NULL
      `;
      let countQuery = `SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL`;
      const queryParams: any[] = [];
      const conditions: string[] = [];

      if (search) {
        queryParams.push(`%${search}%`);
        conditions.push(`(full_name ILIKE $${queryParams.length} OR email ILIKE $${queryParams.length} OR company ILIKE $${queryParams.length} OR mobile ILIKE $${queryParams.length} OR EXISTS (SELECT 1 FROM unnest(tags) tag WHERE tag ILIKE $${queryParams.length}))`);
      }

      if (status === 'active') {
        conditions.push(`is_active = true`);
      } else if (status === 'inactive') {
        conditions.push(`is_active = false`);
      }

      if (session_filter === 'zero') {
        conditions.push(`session_count = 0`);
      } else if (session_filter === 'has') {
        conditions.push(`session_count > 0`);
      }

      if (tags) {
        const tagArray = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        if (tagArray.length > 0) {
          queryParams.push(tagArray);
          conditions.push(`tags @> $${queryParams.length}`);
        }
      }

      if (conditions.length > 0) {
        query += ` AND ` + conditions.join(' AND ');
        countQuery += ` AND ` + conditions.join(' AND ');
      }

      if (session_filter === 'highest') {
        query += ` ORDER BY session_count DESC NULLS LAST, created_at DESC`;
      } else if (session_filter === 'latest') {
        query += ` ORDER BY last_active_at DESC NULLS LAST, created_at DESC`;
      } else {
        query += ` ORDER BY created_at DESC`;
      }

      query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

      const [countResult, result] = await Promise.all([
        fastify.db.query(countQuery, queryParams),
        fastify.db.query(query, [...queryParams, parseInt(limit), offset])
      ]);

      return reply.send(success({
        data: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }));
    }
  );

  // ── GET /api/admin/customers/duplicate-check ─────────
  fastify.get(
    '/api/admin/customers/duplicate-check',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      // Find duplicates by exact email or mobile, or by name similarity
      const dupQuery = `
        WITH duplicate_pairs AS (
          SELECT 
            c1.id as id1, c2.id as id2,
            (c1.email = c2.email) as email_match,
            (c1.mobile = c2.mobile AND c1.mobile IS NOT NULL AND c1.mobile != '') as mobile_match,
            (c1.full_name % c2.full_name AND similarity(c1.full_name, c2.full_name) > 0.95) as name_match
          FROM customers c1
          JOIN customers c2 ON c1.id < c2.id
          WHERE c1.deleted_at IS NULL AND c2.deleted_at IS NULL
            AND (
              c1.email = c2.email 
              OR (c1.mobile = c2.mobile AND c1.mobile IS NOT NULL AND c1.mobile != '')
              OR (c1.full_name % c2.full_name AND similarity(c1.full_name, c2.full_name) > 0.95)
            )
        )
        SELECT 
          id1, id2
        FROM duplicate_pairs;
      `;
      
      let pairs;
      try {
        const res = await fastify.db.query(dupQuery);
        pairs = res.rows;
      } catch (err: any) {
        // Fallback if pg_trgm is not available
        const fallbackQuery = `
          SELECT 
            c1.id as id1, c2.id as id2
          FROM customers c1
          JOIN customers c2 ON c1.id < c2.id
          WHERE c1.deleted_at IS NULL AND c2.deleted_at IS NULL
            AND (
              c1.email = c2.email 
              OR (c1.mobile = c2.mobile AND c1.mobile IS NOT NULL AND c1.mobile != '')
              OR (LEFT(c1.full_name, 5) = LEFT(c2.full_name, 5) AND length(c1.full_name) > 5)
            );
        `;
        const fallbackRes = await fastify.db.query(fallbackQuery);
        pairs = fallbackRes.rows;
      }

      if (pairs.length === 0) {
        return reply.send(success([]));
      }

      // Grouping logic (connected components)
      const adj = new Map<string, Set<string>>();
      const addEdge = (u: string, v: string) => {
        if (!adj.has(u)) adj.set(u, new Set());
        if (!adj.has(v)) adj.set(v, new Set());
        adj.get(u)!.add(v);
        adj.get(v)!.add(u);
      };

      pairs.forEach((p: any) => addEdge(p.id1, p.id2));

      const visited = new Set<string>();
      const groups: string[][] = [];

      for (const [node] of adj) {
        if (!visited.has(node)) {
          const group: string[] = [];
          const queue = [node];
          visited.add(node);

          while (queue.length > 0) {
            const curr = queue.shift()!;
            group.push(curr);
            const neighbors = adj.get(curr) || new Set();
            for (const neighbor of neighbors) {
              if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
              }
            }
          }
          groups.push(group);
        }
      }

      // Fetch customer details for these groups
      const allIds = groups.flat();
      const customerQuery = `
        SELECT id, full_name, email, mobile, country_code, company, city, is_active, created_at, session_count, last_active_at, tags
        FROM customers
        WHERE id = ANY($1)
      `;
      const customerRes = await fastify.db.query(customerQuery, [allIds]);
      const customerMap = new Map();
      customerRes.rows.forEach((c: any) => customerMap.set(c.id, c));

      const formattedGroups = groups.map((g, index) => ({
        group_id: `group_${index}`,
        customers: g.map(id => customerMap.get(id)).filter(Boolean)
      }));

      return reply.send(success(formattedGroups));
    }
  );

  // ── GET /api/admin/customers/:id ─────────────────────
  fastify.get(
    '/api/admin/customers/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const result = await fastify.db.query(`
        SELECT id, full_name, email, mobile, country_code, company, city, is_active, created_at, session_count, last_active_at, tags
        FROM customers
        WHERE id = $1 AND deleted_at IS NULL
      `, [id]);

      if (!result.rows[0]) {
        return reply.status(404).send(error('NOT_FOUND', 'Customer not found'));
      }

      const favResult = await fastify.db.query(`
        SELECT f.id, f.title, f.image_url, f.collection_name, f.code, f.category
        FROM fabrics f
        JOIN customer_favorites cf ON f.id = cf.fabric_id
        WHERE cf.customer_id = $1
      `, [id]);

      return reply.send(success({
        ...result.rows[0],
        favorites: favResult.rows
      }));
    }
  );

  // ── PATCH /api/admin/customers/:id ───────────────────
  fastify.patch(
    '/api/admin/customers/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const { is_active, tags, full_name, email, mobile, country_code, company, city } = request.body;
      
      const updates: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (is_active !== undefined) {
        updates.push(`is_active = $${i++}`);
        values.push(is_active);
      }
      
      if (tags !== undefined) {
        if (!Array.isArray(tags)) {
          return reply.status(400).send(error('VALIDATION_ERROR', 'tags must be an array'));
        }
        updates.push(`tags = $${i++}`);
        values.push(tags);
      }

      if (full_name !== undefined) { updates.push(`full_name = $${i++}`); values.push(full_name); }
      if (email !== undefined) { updates.push(`email = $${i++}`); values.push(email); }
      if (mobile !== undefined) { updates.push(`mobile = $${i++}`); values.push(mobile); }
      if (country_code !== undefined) { updates.push(`country_code = $${i++}`); values.push(country_code); }
      if (company !== undefined) { updates.push(`company = $${i++}`); values.push(company); }
      if (city !== undefined) { updates.push(`city = $${i++}`); values.push(city); }

      if (updates.length === 0) {
        return reply.status(400).send(error('VALIDATION_ERROR', 'No fields to update'));
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const res = await fastify.db.query(`
        UPDATE customers SET ${updates.join(', ')} WHERE id = $${i} RETURNING *
      `, values);

      if (res.rowCount === 0) {
        return reply.status(404).send(error('NOT_FOUND', 'Customer not found'));
      }

      return reply.send(success(res.rows[0]));
    }
  );

  // ── POST /api/admin/customers/create ─────────────────
  fastify.post(
    '/api/admin/customers/create',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { full_name, email, mobile, country_code, company, city, tags, is_active } = request.body;

      if (!full_name || !email) {
        return reply.status(400).send(error('VALIDATION_ERROR', 'full_name and email are required'));
      }

      // Check if email exists
      const checkRes = await fastify.db.query(`SELECT id FROM customers WHERE email = $1 AND deleted_at IS NULL`, [email]);
      if (checkRes.rowCount && checkRes.rowCount > 0) {
        return reply.status(409).send(error('CONFLICT', 'A customer with this email already exists'));
      }

      const tempPassword = crypto.randomBytes(6).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const activeStatus = is_active !== undefined ? is_active : true;
      const parsedTags = Array.isArray(tags) ? tags : [];

      const res = await fastify.db.query(`
        INSERT INTO customers (full_name, email, mobile, country_code, company, city, password_hash, is_active, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, full_name, email, mobile, country_code, company, city, is_active, created_at, tags
      `, [full_name, email, mobile, country_code, company, city, hashedPassword, activeStatus, parsedTags]);

      return reply.send(success({
        customer: res.rows[0],
        tempPassword
      }));
    }
  );

  // ── DELETE /api/admin/customers/:id ──────────────────
  fastify.delete(
    '/api/admin/customers/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      
      const res = await fastify.db.query(`
        UPDATE customers SET is_active = false, deleted_at = NOW() WHERE id = $1 RETURNING id
      `, [id]);

      if (res.rowCount === 0) {
        return reply.status(404).send(error('NOT_FOUND', 'Customer not found'));
      }

      return reply.send(success({ success: true }));
    }
  );

  // ── POST /api/admin/customers/merge ──────────────────
  fastify.post(
    '/api/admin/customers/merge',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { keep_id, merge_ids } = request.body;

      if (!keep_id || !merge_ids || !Array.isArray(merge_ids) || merge_ids.length === 0) {
        return reply.status(400).send(error('VALIDATION_ERROR', 'keep_id and merge_ids (array) are required'));
      }

      const client = await fastify.db.connect();
      try {
        await client.query('BEGIN');

        // Transfer favorites (ignore conflicts if keep_id already favorited the same fabric)
        for (const mId of merge_ids) {
          await client.query(`
            INSERT INTO customer_favorites (customer_id, fabric_id, created_at)
            SELECT $1, fabric_id, created_at FROM customer_favorites WHERE customer_id = $2
            ON CONFLICT (customer_id, fabric_id) DO NOTHING
          `, [keep_id, mId]);
          
          // Delete old favorites to prevent duplication in stats
          await client.query(`DELETE FROM customer_favorites WHERE customer_id = $1`, [mId]);
          
          // Transfer visualisations history if applicable (assuming we might want to keep render history)
          await client.query(`
            UPDATE visualizations SET customer_id = $1 WHERE customer_id = $2
          `, [keep_id, mId]);

          // Merge sessions stats
          await client.query(`
            UPDATE customers c1
            SET 
              session_count = COALESCE(c1.session_count, 0) + COALESCE((SELECT session_count FROM customers WHERE id = $2), 0),
              last_active_at = GREATEST(c1.last_active_at, (SELECT last_active_at FROM customers WHERE id = $2))
            WHERE id = $1
          `, [keep_id, mId]);
        }

        // Soft delete merged customers
        await client.query(`
          UPDATE customers SET is_active = false, deleted_at = NOW() WHERE id = ANY($1)
        `, [merge_ids]);

        await client.query('COMMIT');

        const result = await client.query(`
          SELECT id, full_name, email, mobile, country_code, company, city, is_active, created_at, session_count, last_active_at, tags
          FROM customers
          WHERE id = $1
        `, [keep_id]);

        return reply.send(success(result.rows[0]));
      } catch (err: any) {
        await client.query('ROLLBACK');
        return reply.status(500).send(error('INTERNAL_ERROR', err.message));
      } finally {
        client.release();
      }
    }
  );

}
