import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { success, error } from '../lib/response';
import { requireAdmin } from '../middleware/authenticate';
import { getCreditHistory, grantCredits } from '../services/credit-service';

const grantCreditsSchema = z.object({
  amount: z.number().int(),
  reason: z.string().min(3),
});

export default async function creditRoutes(fastify: FastifyInstance) {

  // ── GET /api/credits/:accessCodeId/history ──────
  fastify.get(
    '/api/credits/:accessCodeId/history',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest<{ Params: { accessCodeId: string } }>, reply: FastifyReply) => {
      const history = await getCreditHistory(fastify.db, request.params.accessCodeId);
      return reply.send(success(history));
    }
  );

  // ── POST /api/credits/:accessCodeId/grant ───────
  fastify.post(
    '/api/credits/:accessCodeId/grant',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest<{ Params: { accessCodeId: string } }>, reply: FastifyReply) => {
      const parsed = grantCreditsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const user = request.user as { userId: string };
      await grantCredits(
        fastify.db,
        request.params.accessCodeId,
        parsed.data.amount,
        parsed.data.reason,
        user.userId
      );

      return reply.send(success({ message: 'Credits updated successfully' }));
    }
  );
}
