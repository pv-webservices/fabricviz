import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { resolveQrCode } from '../services/qr-service';

export default async function qrRoutes(fastify: FastifyInstance) {

  // ── GET /api/qr/:code ──────────────────────────
  fastify.get<{ Params: { code: string } }>(
    '/api/qr/:code',
    async (request: any, reply: any) => {
      const result = await resolveQrCode(fastify.db, request.params.code);
      if (!result) {
        return reply.status(404).send(error('NOT_FOUND', 'QR code not found or inactive'));
      }

      return reply.send(
        success({
          type: 'collection',
          collectionId: result.id,
          name: result.name,
          endUse: result.endUse,
        }),
      );
    },
  );
}
