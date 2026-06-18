import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../lib/response';
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
}
