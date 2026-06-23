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
    async (request: any, reply: any) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send(error('BAD_REQUEST', 'No file uploaded'));
      }

      // Validate MIME type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send(error('BAD_REQUEST', 'Only JPEG, PNG, WEBP, SVG, GIF, MP4, WEBM, and MOV are allowed'));
      }

      try {
        const buffer = await data.toBuffer();

        // 50MB size limit check (50 * 1024 * 1024)
        if (buffer.length > 52428800) {
          return reply.status(400).send(error('BAD_REQUEST', 'File exceeds 50MB limit'));
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
