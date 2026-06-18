import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { writeAuditLog } from '../lib/audit';
import { requireAdmin, type AdminTokenPayload } from '../middleware/authenticate';
import {
  createAccessCodeSchema,
  updateAccessCodeSchema,
  accessCodeQuerySchema,
} from '../validators/access-code-validators';
import {
  listAccessCodes,
  getAccessCodeById,
  createAccessCode,
  updateAccessCode,
  deleteAccessCode,
} from '../services/access-code-service';

export default async function accessCodeRoutes(fastify: FastifyInstance) {

  // ── GET /api/access-codes ──────────────────────
  fastify.get<{ Params: { id: string } }>(
    '/api/access-codes',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const parsed = accessCodeQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }
      const result = await listAccessCodes(fastify.db, parsed.data);
      return reply.send(success({ items: result.items, total: result.total, page: parsed.data.page, limit: parsed.data.limit }));
    },
  );

  // ── GET /api/access-codes/:id ──────────────────
  fastify.get(
    '/api/access-codes/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const accessCode = await getAccessCodeById(fastify.db, request.params.id);
      if (!accessCode) {
        return reply.status(404).send(error('NOT_FOUND', 'Access code not found'));
      }
      return reply.send(success(accessCode));
    },
  );

  // ── POST /api/access-codes ─────────────────────
  fastify.post<{ Params: { id: string } }>(
    '/api/access-codes',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const parsed = createAccessCodeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const user = request.user as AdminTokenPayload;
      const accessCode = await createAccessCode(fastify.db, parsed.data, user.userId);

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'access_code_created',
        entityType: 'access_code',
        entityId: accessCode.id,
        newValue: { code: accessCode.code, customerName: accessCode.customer_name },
        ipAddress: request.ip,
      });

      return reply.status(201).send(success(accessCode));
    },
  );

  // ── PUT /api/access-codes/:id ──────────────────
  fastify.put(
    '/api/access-codes/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const parsed = updateAccessCodeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const existing = await getAccessCodeById(fastify.db, request.params.id);
      if (!existing) {
        return reply.status(404).send(error('NOT_FOUND', 'Access code not found'));
      }

      const updated = await updateAccessCode(fastify.db, request.params.id, parsed.data);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'access_code_updated',
        entityType: 'access_code',
        entityId: request.params.id,
        oldValue: { code: existing.code, active: existing.active },
        newValue: parsed.data as Record<string, unknown>,
        ipAddress: request.ip,
      });

      return reply.send(success(updated));
    },
  );

  // ── DELETE /api/access-codes/:id ───────────────
  fastify.delete<{ Params: { id: string } }>(
    '/api/access-codes/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const existing = await getAccessCodeById(fastify.db, request.params.id);
      if (!existing) {
        return reply.status(404).send(error('NOT_FOUND', 'Access code not found'));
      }

      await deleteAccessCode(fastify.db, request.params.id);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'access_code_deleted',
        entityType: 'access_code',
        entityId: request.params.id,
        oldValue: { code: existing.code, active: existing.active },
        ipAddress: request.ip,
      });

      return reply.send(success({ message: 'Access code deactivated' }));
    },
  );
}
