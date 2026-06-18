import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { writeAuditLog } from '../lib/audit';
import { requireAdmin, type AdminTokenPayload } from '../middleware/authenticate';
import {
  createRoomSchema,
  updateRoomSchema,
  roomQuerySchema,
} from '../validators/room-validators';
import {
  listRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../services/room-service';

export default async function roomRoutes(fastify: FastifyInstance) {

  // ── GET /api/rooms ─────────────────────────────
  fastify.get<{ Params: { id: string } }>('/api/rooms', async (request: any, reply: any) => {
    const parsed = roomQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
    }
    const result = await listRooms(fastify.db, parsed.data);
    return reply.send(success({ items: result.items, total: result.total, page: parsed.data.page, limit: parsed.data.limit }));
  });

  // ── GET /api/rooms/:id ─────────────────────────
  fastify.get('/api/rooms/:id', async (request: any, reply: any) => {
    const room = await getRoomById(fastify.db, request.params.id);
    if (!room) {
      return reply.status(404).send(error('NOT_FOUND', 'Room not found'));
    }
    return reply.send(success(room));
  });

  // ── POST /api/rooms ────────────────────────────
  fastify.post<{ Params: { id: string } }>(
    '/api/rooms',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const parsed = createRoomSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const room = await createRoom(fastify.db, parsed.data);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'room_created',
        entityType: 'predefined_room',
        entityId: room.id,
        newValue: { name: parsed.data.name, endUse: parsed.data.endUse },
        ipAddress: request.ip,
      });

      return reply.status(201).send(success(room));
    },
  );

  // ── PUT /api/rooms/:id ─────────────────────────
  fastify.put(
    '/api/rooms/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const parsed = updateRoomSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      const existing = await getRoomById(fastify.db, request.params.id);
      if (!existing) {
        return reply.status(404).send(error('NOT_FOUND', 'Room not found'));
      }

      const updated = await updateRoom(fastify.db, request.params.id, parsed.data);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'room_updated',
        entityType: 'predefined_room',
        entityId: request.params.id,
        oldValue: { name: existing.name, endUse: existing.end_use },
        newValue: parsed.data as Record<string, unknown>,
        ipAddress: request.ip,
      });

      return reply.send(success(updated));
    },
  );

  // ── DELETE /api/rooms/:id ──────────────────────
  fastify.delete<{ Params: { id: string } }>(
    '/api/rooms/:id',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const existing = await getRoomById(fastify.db, request.params.id);
      if (!existing) {
        return reply.status(404).send(error('NOT_FOUND', 'Room not found'));
      }

      await deleteRoom(fastify.db, request.params.id);
      const user = request.user as AdminTokenPayload;

      await writeAuditLog(fastify.db, {
        userId: user.userId,
        action: 'room_deleted',
        entityType: 'predefined_room',
        entityId: request.params.id,
        oldValue: { name: existing.name },
        ipAddress: request.ip,
      });

      return reply.send(success({ message: 'Room deactivated' }));
    },
  );
}
