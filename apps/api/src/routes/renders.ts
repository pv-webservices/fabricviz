import { FastifyInstance } from 'fastify';
import { Queue } from 'bullmq';
import { success, error } from '../lib/response';
import { createRenderSchema, isMultiAreaInput } from '../validators/render-validators';
import { createRenderJob, getRenderStatus } from '../services/render-service';
import { authenticate, type TokenPayload } from '../middleware/authenticate';
import { trackEvent } from '../services/analytics-service';

export default async function renderRoutes(fastify: FastifyInstance) {
  // Initialize BullMQ queue using Fastify's Redis connection
  const renderQueue = new Queue('render-jobs', { connection: fastify.redis as any });

  // ── POST /api/renders ──────────────────────────
  fastify.post(
    '/api/renders',
    {
      preHandler: [authenticate],
      config: { rateLimit: { max: 15, timeWindow: '1 minute' } },
    },
    async (request: any, reply: any) => {
      const parsed = createRenderSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const user = request.user as TokenPayload;
      const accessCodeId = 'accessCodeId' in user ? (user as any).accessCodeId : undefined;

      try {
        const result = await createRenderJob(fastify.db, renderQueue, parsed.data, accessCodeId);

        // Track analytics event
        if (isMultiAreaInput(parsed.data)) {
          await trackEvent(
            fastify.db,
            {
              eventName: 'render_requested',
              fabricId: parsed.data.areaAssignments[0]?.fabricId,
              visualizationId: result.visualizationId,
              metadata: {
                model: parsed.data.model ?? 'fast',
                areasCount: result.areasCount,
                sourceType: parsed.data.sourceType,
              },
            },
            accessCodeId,
          );
        } else {
          await trackEvent(
            fastify.db,
            {
              eventName: 'render_requested',
              fabricId: (parsed.data as any).fabricId,
              visualizationId: result.visualizationId,
              metadata: {
                objectType: (parsed.data as any).objectType,
                sourceType: parsed.data.sourceType,
              },
            },
            accessCodeId,
          );
        }

        return reply.status(201).send(success(result));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message.includes('not found') || message.includes('inactive')) {
          return reply.status(404).send(error('NOT_FOUND', message));
        }
        if (message.includes('Insufficient credits')) {
          return reply.status(402).send(error('INSUFFICIENT_CREDITS', message));
        }
        return reply.status(500).send(error('INTERNAL_ERROR', message));
      }
    },
  );

  // ── GET /api/renders/:jobId/status ─────────────
  fastify.get(
    '/api/renders/:jobId/status',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const status = await getRenderStatus(fastify.db, request.params.jobId);
      if (!status) {
        return reply.status(404).send(error('NOT_FOUND', 'Render job not found'));
      }
      return reply.send(success(status));
    },
  );
}
