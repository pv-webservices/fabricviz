import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { authenticate, type TokenPayload } from '../middleware/authenticate';
import { getHistoryItem } from '../services/history-service';

export default async function resultRoutes(fastify: FastifyInstance) {

  // ── GET /api/results/:id ───────────────────────
  fastify.get<{ Params: { id: string } }>(
    '/api/results/:id',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const user = request.user as TokenPayload;
      const accessCodeId = 'accessCodeId' in user ? user.accessCodeId : undefined;

      const item = await getHistoryItem(fastify.db, request.params.id, accessCodeId);
      if (!item) {
        return reply.status(404).send(error('NOT_FOUND', 'Result not found'));
      }

      // Payload specific for the Result UI page
      const payload = {
        id: item.id,
        status: item.status,
        objectType: item.object_type,
        sourceType: item.source_type,
        beforeUrl: item.before_url,
        afterUrl: item.after_url,
        pdfUrl: item.pdf_url,
        createdAt: item.created_at,
        fabricSnapshot: {
          name: item.fabric_name,
          collectionName: item.collection_name,
          colorFamily: item.color_family,
          endUse: item.fabric_end_use,
          thumbnailUrl: item.fabric_thumbnail,
        },
        roomName: item.room_name,
      };

      return reply.send(success(payload));
    }
  );
}
