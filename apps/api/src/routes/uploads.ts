import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { uploadFile, recordStorageSnapshot } from '../services/storage-service';
import { authenticate, type TokenPayload } from '../middleware/authenticate';
import { trackEvent } from '../services/analytics-service';

export default async function uploadRoutes(fastify: FastifyInstance) {
  // ── POST /api/uploads ──────────────────────────
  fastify.post(
    '/api/uploads',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send(error('BAD_REQUEST', 'No file uploaded'));
      }

      // Validate MIME type
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send(error('BAD_REQUEST', 'Only JPEG and PNG are allowed'));
      }

      try {
        const buffer = await data.toBuffer();

        // 10MB size limit check (10 * 1024 * 1024)
        if (buffer.length > 10485760) {
          return reply.status(400).send(error('BAD_REQUEST', 'File exceeds 10MB limit'));
        }

        const url = await uploadFile(buffer, data.filename, data.mimetype);

        // Record storage usage
        await recordStorageSnapshot(fastify.db, buffer.length, 1);

        // Track event
        const user = request.user as TokenPayload;
        const accessCodeId = 'accessCodeId' in user ? user.accessCodeId : undefined;
        await trackEvent(fastify.db, {
          eventName: 'upload_completed',
          metadata: { size: buffer.length, mimetype: data.mimetype },
        }, accessCodeId);

        return reply.status(201).send(success({ url }));
      } catch (err) {
        return reply.status(500).send(error('INTERNAL_ERROR', 'File upload failed'));
      }
    }
  );
}
