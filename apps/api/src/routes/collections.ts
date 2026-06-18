import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { writeAuditLog } from '../lib/audit';
import { requireAdmin, type AdminTokenPayload } from '../middleware/authenticate';
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionQuerySchema,
} from '../validators/collection-validators';
import {
  listCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionFabricCount,
} from '../services/collection-service';

export default async function collectionRoutes(fastify: FastifyInstance) {

  // ── GET /api/collections ───────────────────────
  fastify.get('/api/collections', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = collectionQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
    }
    const result = await listCollections(fastify.db, parsed.data);
    return reply.send(success({ items: result.items, total: result.total, page: parsed.data.page, limit: parsed.data.limit }));
  });

  // ── GET /api/collections/:id ───────────────────
  fastify.get('/api/collections/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const collection = await getCollectionById(fastify.db, request.params.id);
    if (!collection) {
      return reply.status(404).send(error('NOT_FOUND', 'Collection not found'));
    }
    const fabricCount = await getCollectionFabricCount(fastify.db, collection.id);
    return reply.send(success({ ...collection, fabricCount }));
  });

  // ── POST /api/collections ─────────────────────
  fastify.post(
    '/api/collections',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createCollectionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const collection = await createCollection(fastify.db, parsed.data);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'collection_created',
        entityType: 'collection',
        entityId: collection.id,
        newValue: parsed.data as Record<string, unknown>,
        ipAddress: request.ip,
      });

      return reply.status(201).send(success(collection));
    },
  );

  // ── PUT /api/collections/:id ──────────────────
  fastify.put(
    '/api/collections/:id',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const parsed = updateCollectionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const existing = await getCollectionById(fastify.db, request.params.id);
      if (!existing) {
        return reply.status(404).send(error('NOT_FOUND', 'Collection not found'));
      }

      const updated = await updateCollection(fastify.db, request.params.id, parsed.data);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'collection_updated',
        entityType: 'collection',
        entityId: request.params.id,
        oldValue: existing as unknown as Record<string, unknown>,
        newValue: parsed.data as Record<string, unknown>,
        ipAddress: request.ip,
      });

      return reply.send(success(updated));
    },
  );

  // ── DELETE /api/collections/:id ───────────────
  fastify.delete(
    '/api/collections/:id',
    { preHandler: [requireAdmin] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const existing = await getCollectionById(fastify.db, request.params.id);
      if (!existing) {
        return reply.status(404).send(error('NOT_FOUND', 'Collection not found'));
      }

      await deleteCollection(fastify.db, request.params.id);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'collection_deleted',
        entityType: 'collection',
        entityId: request.params.id,
        oldValue: { name: existing.name, active: existing.active },
        ipAddress: request.ip,
      });

      return reply.send(success({ message: 'Collection deactivated' }));
    },
  );
}
