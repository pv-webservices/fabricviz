import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { requireAdmin, authenticate, type TokenPayload } from '../middleware/authenticate';
import { trackEventSchema } from '../validators/analytics-validators';
import { trackEvent, getAnalyticsDashboard } from '../services/analytics-service';

export default async function analyticsRoutes(fastify: FastifyInstance) {

  // ── POST /api/analytics/track ──────────────────
  fastify.post(
    '/api/analytics/track',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const parsed = trackEventSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const user = request.user as TokenPayload;
      // If the user is a customer, they have an accessCodeId
      const accessCodeId = 'accessCodeId' in user ? user.accessCodeId : undefined;

      await trackEvent(fastify.db, parsed.data, accessCodeId);
      return reply.status(201).send(success({ message: 'Event tracked successfully' }));
    },
  );

  // ── GET /api/analytics/dashboard ───────────────
  fastify.get(
    '/api/analytics/dashboard',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const dashboard = await getAnalyticsDashboard(fastify.db);
      return reply.send(success(dashboard));
    },
  );
}
