import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { writeAuditLog } from '../lib/audit';
import { requireAdmin, type AdminTokenPayload } from '../middleware/authenticate';
import {
  createRequestSchema,
  updateRequestSchema,
  requestQuerySchema,
} from '../validators/request-validators';
import {
  listRequests,
  getRequestById,
  createRequest,
  updateRequest,
} from '../services/request-service';
import { grantCredits } from '../services/credit-service';

export default async function requestRoutes(fastify: FastifyInstance) {

  // ── GET /api/requests ──────────────────────────
  fastify.get(
    '/api/requests',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = requestQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }
      const result = await listRequests(fastify.db, parsed.data);
      return reply.send(success({ items: result.items, total: result.total, page: parsed.data.page, limit: parsed.data.limit }));
    },
  );

  // ── GET /api/requests/:id ──────────────────────
  fastify.get(
    '/api/requests/:id',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const req = await getRequestById(fastify.db, request.params.id);
      if (!req) {
        return reply.status(404).send(error('NOT_FOUND', 'Request not found'));
      }
      return reply.send(success(req));
    },
  );

  // ── POST /api/requests ─────────────────────────
  fastify.post(
    '/api/requests',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Public endpoint for customers to submit requests
      const parsed = createRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const req = await createRequest(fastify.db, parsed.data);
      return reply.status(201).send(success(req));
    },
  );

  // ── PATCH /api/requests/:id ────────────────────
  fastify.patch(
    '/api/requests/:id',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const parsed = updateRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const existing = await getRequestById(fastify.db, request.params.id);
      if (!existing) {
        return reply.status(404).send(error('NOT_FOUND', 'Request not found'));
      }

      const user = request.user as AdminTokenPayload;
      const updated = await updateRequest(fastify.db, request.params.id, parsed.data, user.userId);

      // Auto-handle credit granting if approved
      if (
        existing.type === 'credit_request' && 
        parsed.data.status === 'approved' && 
        existing.status !== 'approved' &&
        existing.access_code_id
      ) {
        // Just grant a default amount for this sprint, or parse it from message
        await grantCredits(
          fastify.db, 
          existing.access_code_id, 
          100, // Hardcoded default grant per approval
          'Credit Request Approved', 
          user.userId
        );
      }

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'request_updated',
        entityType: 'request',
        entityId: request.params.id,
        oldValue: { status: existing.status, adminNotes: existing.admin_notes },
        newValue: { status: parsed.data.status, adminNotes: parsed.data.adminNotes },
        ipAddress: request.ip,
      });

      return reply.send(success(updated));
    },
  );
}
