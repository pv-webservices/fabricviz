import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { writeAuditLog } from '../lib/audit';
import { requireAdmin, type AdminTokenPayload } from '../middleware/authenticate';
import {
  createFabricSchema,
  updateFabricSchema,
  fabricQuerySchema,
  bulkImportSchema,
} from '../validators/fabric-validators';
import {
  listFabrics,
  getFabricById,
  createFabric,
  updateFabric,
  deleteFabric,
  bulkCreateFabrics,
} from '../services/fabric-service';

export default async function fabricRoutes(fastify: FastifyInstance) {

  // ── GET /api/fabrics ───────────────────────────
  fastify.get('/api/fabrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = fabricQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
    }
    const result = await listFabrics(fastify.db, parsed.data);
    return reply.send(success({ items: result.items, total: result.total, page: parsed.data.page, limit: parsed.data.limit }));
  });

  // ── GET /api/fabrics/:id ───────────────────────
  fastify.get('/api/fabrics/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const fabric = await getFabricById(fastify.db, request.params.id);
    if (!fabric) {
      return reply.status(404).send(error('NOT_FOUND', 'Fabric not found'));
    }
    return reply.send(success(fabric));
  });

  // ── POST /api/fabrics ──────────────────────────
  fastify.post(
    '/api/fabrics',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createFabricSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const fabric = await createFabric(fastify.db, parsed.data);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'fabric_created',
        entityType: 'fabric',
        entityId: fabric.id,
        newValue: { name: parsed.data.name, code: parsed.data.code, collectionId: parsed.data.collectionId },
        ipAddress: request.ip,
      });

      return reply.status(201).send(success(fabric));
    },
  );

  // ── PUT /api/fabrics/:id ───────────────────────
  fastify.put(
    '/api/fabrics/:id',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const parsed = updateFabricSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const existing = await getFabricById(fastify.db, request.params.id);
      if (!existing) {
        return reply.status(404).send(error('NOT_FOUND', 'Fabric not found'));
      }

      const updated = await updateFabric(fastify.db, request.params.id, parsed.data);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'fabric_updated',
        entityType: 'fabric',
        entityId: request.params.id,
        oldValue: { name: existing.name, code: existing.code },
        newValue: parsed.data as Record<string, unknown>,
        ipAddress: request.ip,
      });

      return reply.send(success(updated));
    },
  );

  // ── DELETE /api/fabrics/:id ────────────────────
  fastify.delete(
    '/api/fabrics/:id',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const existing = await getFabricById(fastify.db, request.params.id);
      if (!existing) {
        return reply.status(404).send(error('NOT_FOUND', 'Fabric not found'));
      }

      await deleteFabric(fastify.db, request.params.id);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'fabric_deleted',
        entityType: 'fabric',
        entityId: request.params.id,
        oldValue: { name: existing.name, code: existing.code },
        ipAddress: request.ip,
      });

      return reply.send(success({ message: 'Fabric deactivated' }));
    },
  );

  // ── POST /api/fabrics/import ───────────────────
  fastify.post(
    '/api/fabrics/import',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = bulkImportSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const result = await bulkCreateFabrics(fastify.db, parsed.data.fabrics);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'fabrics_bulk_imported',
        entityType: 'fabric',
        newValue: { requested: parsed.data.fabrics.length, imported: result.imported, errorCount: result.errors.length },
        ipAddress: request.ip,
      });

      return reply.send(success(result));
    },
  );
}
