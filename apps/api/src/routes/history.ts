import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { success, error } from '../lib/response';
import { requireAdmin, authenticate, type TokenPayload } from '../middleware/authenticate';
import { getHistory, getHistoryItem, deleteHistoryItem } from '../services/history-service';
import { writeAuditLog } from '../lib/audit';
import { trackEvent } from '../services/analytics-service';

const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export default async function historyRoutes(fastify: FastifyInstance) {

  // ── GET /api/history ───────────────────────────
  fastify.get<{ Params: { id: string } }>(
    '/api/history',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const parsed = historyQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const user = request.user as TokenPayload;
      const accessCodeId = 'accessCodeId' in user ? user.accessCodeId : undefined;

      // Customers only see their own. Admins see all unless they specify a filter (omitted here for simplicity, but service supports it).
      const result = await getHistory(fastify.db, {
        accessCodeId,
        page: parsed.data.page,
        limit: parsed.data.limit,
      });

      return reply.send(success(result));
    }
  );

  // ── GET /api/history/:id ───────────────────────
  fastify.get(
    '/api/history/:id',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const user = request.user as TokenPayload;
      const accessCodeId = 'accessCodeId' in user ? user.accessCodeId : undefined;

      const item = await getHistoryItem(fastify.db, request.params.id, accessCodeId);
      if (!item) {
        return reply.status(404).send(error('NOT_FOUND', 'Visualization not found'));
      }

      await trackEvent(fastify.db, {
        eventName: 'history_viewed',
        visualizationId: request.params.id,
      }, accessCodeId);

      return reply.send(success(item));
    }
  );

  // ── DELETE /api/history/:id ────────────────────
  fastify.delete<{ Params: { id: string } }>(
    '/api/history/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const item = await getHistoryItem(fastify.db, request.params.id);
      if (!item) {
        return reply.status(404).send(error('NOT_FOUND', 'Visualization not found'));
      }

      await deleteHistoryItem(fastify.db, request.params.id);

      const user = request.user as { userId: string };
      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'visualization_deleted',
        entityType: 'visualization',
        entityId: request.params.id,
        ipAddress: request.ip,
      });

      return reply.send(success({ message: 'History item removed' }));
    }
  );
}
