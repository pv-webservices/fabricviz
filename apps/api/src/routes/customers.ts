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

  // ── GET /api/admin/customers/generate-code ───────────
  fastify.get(
    '/api/admin/customers/generate-code',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      let code = '';
      let attempts = 0;
      let isUnique = false;

      while (!isUnique && attempts < 10) {
        // Generate random 5-digit string (00000 - 99999)
        code = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const res = await fastify.db.query(`SELECT id FROM customers WHERE access_code = $1`, [code]);
        if (res.rowCount === 0) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        return reply.status(500).send(error('INTERNAL_ERROR', 'Failed to generate a unique access code'));
      }

      return reply.send(success({ code }));
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
        SELECT 
          c.id, c.full_name, c.email, c.mobile, c.country_code, c.company, c.city, 
          c.is_active, c.created_at, c.session_count, c.last_active_at, c.tags, c.access_code, c.notes,
          json_build_object(
            'total_credits', COALESCE(cc.total_credits, 0), 
            'used_credits', COALESCE(cc.used_credits, 0), 
            'remaining_credits', GREATEST(0, COALESCE(cc.total_credits, 0) - COALESCE(cc.used_credits, 0))
          ) as credits
        FROM customers c
        LEFT JOIN customer_credits cc ON c.id = cc.customer_id
        WHERE c.deleted_at IS NULL
      `;
      let countQuery = `SELECT COUNT(*) FROM customers c WHERE c.deleted_at IS NULL`;
      const queryParams: any[] = [];
      const conditions: string[] = [];

      if (search) {
        queryParams.push(`%${search}%`);
        conditions.push(`(c.full_name ILIKE $${queryParams.length} OR c.email ILIKE $${queryParams.length} OR c.company ILIKE $${queryParams.length} OR c.mobile ILIKE $${queryParams.length} OR c.access_code ILIKE $${queryParams.length} OR EXISTS (SELECT 1 FROM unnest(c.tags) tag WHERE tag ILIKE $${queryParams.length}))`);
      }

      if (status === 'active') {
        conditions.push(`c.is_active = true`);
      } else if (status === 'inactive') {
        conditions.push(`c.is_active = false`);
      }

      if (session_filter === 'zero') {
        conditions.push(`c.session_count = 0`);
      } else if (session_filter === 'has') {
        conditions.push(`c.session_count > 0`);
      }

      if (tags) {
        const tagArray = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        if (tagArray.length > 0) {
          queryParams.push(tagArray);
          conditions.push(`c.tags @> $${queryParams.length}`);
        }
      }

      if (conditions.length > 0) {
        query += ` AND ` + conditions.join(' AND ');
        countQuery += ` AND ` + conditions.join(' AND ');
      }

      if (session_filter === 'highest') {
        query += ` ORDER BY c.session_count DESC NULLS LAST, c.created_at DESC`;
      } else if (session_filter === 'latest') {
        query += ` ORDER BY c.last_active_at DESC NULLS LAST, c.created_at DESC`;
      } else {
        query += ` ORDER BY c.created_at DESC`;
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
        SELECT id1, id2 FROM duplicate_pairs;
      `;
      
      let pairs;
      try {
        const res = await fastify.db.query(dupQuery);
        pairs = res.rows;
      } catch (err: any) {
        const fallbackQuery = `
          SELECT c1.id as id1, c2.id as id2
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

      const allIds = groups.flat();
      const customerQuery = `
        SELECT id, full_name, email, mobile, country_code, company, city, is_active, created_at, session_count, last_active_at, tags, access_code
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
        SELECT c.*,
          json_build_object(
            'total_credits', COALESCE(cc.total_credits, 0), 
            'used_credits', COALESCE(cc.used_credits, 0), 
            'remaining_credits', GREATEST(0, COALESCE(cc.total_credits, 0) - COALESCE(cc.used_credits, 0))
          ) as credits
        FROM customers c
        LEFT JOIN customer_credits cc ON c.id = cc.customer_id
        WHERE c.id = $1 AND c.deleted_at IS NULL
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

  // ── GET /api/admin/customers/:id/stats ─────────────────
  fastify.get(
    '/api/admin/customers/:id/stats',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      
      const customerResult = await fastify.db.query(`
        SELECT id, access_code, full_name, company, city
        FROM customers WHERE id = $1 AND deleted_at IS NULL
      `, [id]);

      if (!customerResult.rows[0]) {
        return reply.status(404).send(error('NOT_FOUND', 'Customer not found'));
      }

      const creditsResult = await fastify.db.query(`
        SELECT total_credits, used_credits
        FROM customer_credits WHERE customer_id = $1
      `, [id]);
      const creds = creditsResult.rows[0] || { total_credits: 30, used_credits: 0 };
      const credits = {
        total_credits: creds.total_credits,
        used_credits: creds.used_credits,
        remaining_credits: Math.max(0, creds.total_credits - creds.used_credits)
      };

      const creditHistoryResult = await fastify.db.query(`
        SELECT id, amount, note, granted_by, created_at
        FROM customer_credit_history
        WHERE customer_id = $1
        ORDER BY created_at DESC
      `, [id]);

      const vizHistoryResult = await fastify.db.query(`
        SELECT id, fabric_name, fabric_category, thumbnail_url, created_at
        FROM customer_visualizations
        WHERE customer_id = $1
        ORDER BY created_at DESC
      `, [id]);

      const activityResult = await fastify.db.query(`
        SELECT areas_selected, fabrics_selected, visualizations_generated, images_uploaded, images_downloaded
        FROM customer_activity_summary
        WHERE customer_id = $1
      `, [id]);
      const activity_summary = activityResult.rows[0] || {
        areas_selected: 0, fabrics_selected: 0, visualizations_generated: 0, images_uploaded: 0, images_downloaded: 0
      };

      return reply.send(success({
        customer: customerResult.rows[0],
        credits,
        credit_history: creditHistoryResult.rows,
        visualization_history: vizHistoryResult.rows,
        activity_summary
      }));
    }
  );

  // ── POST /api/admin/customers/:id/credits ───────────────
  fastify.post(
    '/api/admin/customers/:id/credits',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const { amount, note } = request.body;

      if (![10, 20, 30, 50, 100].includes(amount)) {
        return reply.status(400).send(error('VALIDATION_ERROR', 'Amount must be 10, 20, 30, 50, or 100'));
      }

      const client = await fastify.db.connect();
      try {
        await client.query('BEGIN');
        
        // Ensure customer exists
        const custRes = await client.query('SELECT id FROM customers WHERE id = $1', [id]);
        if (custRes.rowCount === 0) {
          throw new Error('NOT_FOUND: Customer not found');
        }

        // Add credits
        const creditRes = await client.query(`
          INSERT INTO customer_credits (customer_id, total_credits, used_credits)
          VALUES ($1, $2, 0)
          ON CONFLICT (customer_id) DO UPDATE
          SET total_credits = customer_credits.total_credits + EXCLUDED.total_credits, updated_at = NOW()
          RETURNING total_credits, used_credits
        `, [id, amount]);

        const adminEmail = request.user?.email || 'admin@example.com';
        await client.query(`
          INSERT INTO customer_credit_history (customer_id, amount, note, granted_by)
          VALUES ($1, $2, $3, $4)
        `, [id, amount, note || null, adminEmail]);

        await client.query('COMMIT');
        
        const creds = creditRes.rows[0];
        return reply.send(success({
          total_credits: creds.total_credits,
          used_credits: creds.used_credits,
          remaining_credits: Math.max(0, creds.total_credits - creds.used_credits)
        }));
      } catch (err: any) {
        await client.query('ROLLBACK');
        if (err.message.startsWith('NOT_FOUND')) {
          return reply.status(404).send(error('NOT_FOUND', 'Customer not found'));
        }
        return reply.status(500).send(error('INTERNAL_ERROR', err.message));
      } finally {
        client.release();
      }
    }
  );

  // ── PATCH /api/admin/customers/:id ───────────────────
  fastify.patch(
    '/api/admin/customers/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const { is_active, tags, full_name, email, mobile, country_code, company, city, notes, access_code } = request.body;
      
      if (access_code !== undefined) {
        const checkRes = await fastify.db.query(`SELECT id FROM customers WHERE access_code = $1 AND id != $2`, [access_code, id]);
        if (checkRes.rowCount && checkRes.rowCount > 0) {
          return reply.status(409).send(error('CONFLICT', 'Access code already in use. Please choose a different code.'));
        }
      }

      if (email !== undefined) {
        const checkRes = await fastify.db.query(`SELECT id FROM customers WHERE email = $1 AND id != $2`, [email, id]);
        if (checkRes.rowCount && checkRes.rowCount > 0) {
          return reply.status(409).send(error('CONFLICT', 'A customer with this email already exists.'));
        }
      }

      const updates: string[] = [];
      const values: any[] = [];
      let i = 1;

      if (is_active !== undefined) { updates.push(`is_active = $${i++}`); values.push(is_active); }
      if (tags !== undefined) {
        if (!Array.isArray(tags)) return reply.status(400).send(error('VALIDATION_ERROR', 'tags must be an array'));
        updates.push(`tags = $${i++}`); values.push(tags);
      }
      if (full_name !== undefined) { updates.push(`full_name = $${i++}`); values.push(full_name); }
      if (email !== undefined) { updates.push(`email = $${i++}`); values.push(email); }
      if (mobile !== undefined) { updates.push(`mobile = $${i++}`); values.push(mobile); }
      if (country_code !== undefined) { updates.push(`country_code = $${i++}`); values.push(country_code); }
      if (company !== undefined) { updates.push(`company = $${i++}`); values.push(company); }
      if (city !== undefined) { updates.push(`city = $${i++}`); values.push(city); }
      if (notes !== undefined) { updates.push(`notes = $${i++}`); values.push(notes); }
      if (access_code !== undefined) { updates.push(`access_code = $${i++}`); values.push(access_code); }

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
      const { access_code, full_name, email, mobile, country_code, company, city, notes, tags, is_active } = request.body;

      if (!full_name || !email || !access_code) {
        return reply.status(400).send(error('VALIDATION_ERROR', 'full_name, email, and access_code are required'));
      }

      // Check access_code unique
      const checkCodeRes = await fastify.db.query(`SELECT id FROM customers WHERE access_code = $1`, [access_code]);
      if (checkCodeRes.rowCount && checkCodeRes.rowCount > 0) {
        return reply.status(409).send(error('CONFLICT', 'Access code already in use. Please choose a different code.'));
      }

      // Check email unique
      const checkEmailRes = await fastify.db.query(`SELECT id FROM customers WHERE email = $1`, [email]);
      if (checkEmailRes.rowCount && checkEmailRes.rowCount > 0) {
        return reply.status(409).send(error('CONFLICT', 'A customer with this email already exists.'));
      }

      const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 chars hex
      const hashedPassword = await bcrypt.hash(tempPassword, 12);
      const activeStatus = is_active !== undefined ? is_active : true;
      const parsedTags = Array.isArray(tags) ? tags : [];

      const client = await fastify.db.connect();
      try {
        await client.query('BEGIN');
        
        const res = await client.query(`
          INSERT INTO customers (full_name, email, mobile, country_code, company, city, password_hash, is_active, tags, access_code, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id, full_name, email, mobile, country_code, company, city, is_active, created_at, tags, access_code, notes
        `, [full_name, email, mobile, country_code, company, city, hashedPassword, activeStatus, parsedTags, access_code, notes]);

        const customer = res.rows[0];

        // Init credits
        await client.query(`
          INSERT INTO customer_credits (customer_id, total_credits, used_credits)
          VALUES ($1, 30, 0)
        `, [customer.id]);

        // Init stats
        await client.query(`
          INSERT INTO customer_activity_summary (customer_id) VALUES ($1)
        `, [customer.id]);

        await client.query('COMMIT');

        return reply.send(success({
          customer,
          temp_password: tempPassword // plaintext password for admin to share
        }));
      } catch (err: any) {
        await client.query('ROLLBACK');
        return reply.status(500).send(error('INTERNAL_ERROR', err.message));
      } finally {
        client.release();
      }
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

        for (const mId of merge_ids) {
          // Transfer favorites
          await client.query(`
            INSERT INTO customer_favorites (customer_id, fabric_id, created_at)
            SELECT $1, fabric_id, created_at FROM customer_favorites WHERE customer_id = $2
            ON CONFLICT (customer_id, fabric_id) DO NOTHING
          `, [keep_id, mId]);
          await client.query(`DELETE FROM customer_favorites WHERE customer_id = $1`, [mId]);
          
          // Transfer visualisations
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
          SELECT c.*,
            json_build_object(
              'total_credits', COALESCE(cc.total_credits, 0), 
              'used_credits', COALESCE(cc.used_credits, 0), 
              'remaining_credits', GREATEST(0, COALESCE(cc.total_credits, 0) - COALESCE(cc.used_credits, 0))
            ) as credits
          FROM customers c
          LEFT JOIN customer_credits cc ON c.id = cc.customer_id
          WHERE c.id = $1
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
