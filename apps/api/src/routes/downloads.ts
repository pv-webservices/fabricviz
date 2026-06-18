import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { authenticate, type TokenPayload } from '../middleware/authenticate';
import { generatePdfStub } from '../services/pdf-service';
import { trackEvent } from '../services/analytics-service';

export default async function downloadRoutes(fastify: FastifyInstance) {

  // ── GET /api/downloads/:id/image ───────────────
  fastify.get<{ Params: { id: string } }>(
    '/api/downloads/:id/image',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      
      const res = await fastify.db.query(`SELECT after_url FROM visualizations WHERE id = $1 AND active = true`, [id]);
      if (res.rowCount === 0 || !res.rows[0].after_url) {
        return reply.status(404).send(error('NOT_FOUND', 'Render image not available'));
      }

      const user = request.user as TokenPayload;
      const accessCodeId = 'accessCodeId' in user ? user.accessCodeId : undefined;
      await trackEvent(fastify.db, { eventName: 'image_downloaded', visualizationId: id }, accessCodeId);

      // We redirect to the actual cloud storage URL
      return reply.redirect(res.rows[0].after_url);
    }
  );

  // ── GET /api/downloads/:id/pdf ─────────────────
  fastify.get<{ Params: { id: string } }>(
    '/api/downloads/:id/pdf',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;

      const res = await fastify.db.query(`SELECT pdf_url, status FROM visualizations WHERE id = $1 AND active = true`, [id]);
      if (res.rowCount === 0 || res.rows[0].status !== 'completed') {
        return reply.status(404).send(error('NOT_FOUND', 'Render not complete or not found'));
      }

      let pdfUrl = res.rows[0].pdf_url;
      if (!pdfUrl) {
        // Generate it on the fly if missing
        pdfUrl = await generatePdfStub(fastify.db, id);
      }

      const user = request.user as TokenPayload;
      const accessCodeId = 'accessCodeId' in user ? user.accessCodeId : undefined;
      await trackEvent(fastify.db, { eventName: 'pdf_downloaded', visualizationId: id }, accessCodeId);

      return reply.redirect(pdfUrl);
    }
  );
}
