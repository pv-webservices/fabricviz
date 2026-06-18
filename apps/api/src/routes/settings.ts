import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { success, error } from '../lib/response';
import { requireAdmin, type TokenPayload } from '../middleware/authenticate';
import { getSettings, updateSettings } from '../services/settings-service';

const updateSettingsSchema = z.record(z.string());

export default async function settingsRoutes(fastify: FastifyInstance) {

  // ── GET /api/settings ──────────────────────────
  fastify.get(
    '/api/settings',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Publicly accessible for frontend context (site name, tutorial url, etc)
      const settings = await getSettings(fastify.db);
      return reply.send(success(settings));
    }
  );

  // ── PATCH /api/settings ────────────────────────
  fastify.patch(
    '/api/settings',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = updateSettingsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', 'Invalid settings payload'));
      }

      const user = request.user as { userId: string };
      await updateSettings(fastify.db, parsed.data, user.userId);
      
      return reply.send(success({ message: 'Settings updated successfully' }));
    }
  );
}
