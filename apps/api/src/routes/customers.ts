import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { requireAdmin } from '../middleware/authenticate';
import { getCustomerUsageStats, getCustomerWarnings } from '../services/customer-service';

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
      const { search = '', page = '1', limit = '20' } = request.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let query = `
        SELECT id, full_name, email, mobile, country_code, company, city, is_active, created_at
        FROM customers
      `;
      let countQuery = `SELECT COUNT(*) FROM customers`;
      const queryParams: any[] = [];

      if (search) {
        query += ` WHERE full_name ILIKE $1 OR email ILIKE $1`;
        countQuery += ` WHERE full_name ILIKE $1 OR email ILIKE $1`;
        queryParams.push(`%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

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

  // ── GET /api/admin/customers/:id ─────────────────────
  fastify.get(
    '/api/admin/customers/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const result = await fastify.db.query(`
        SELECT id, full_name, email, mobile, country_code, company, city, is_active, created_at
        FROM customers
        WHERE id = $1
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
      const { is_active } = request.body;

      if (typeof is_active !== 'boolean') {
        return reply.status(400).send(error('VALIDATION_ERROR', 'is_active must be a boolean'));
      }

      await fastify.db.query(`
        UPDATE customers SET is_active = $1, updated_at = NOW() WHERE id = $2
      `, [is_active, id]);

      return reply.send(success({ success: true }));
    }
  );
}
