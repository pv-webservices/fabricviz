import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success } from '../lib/response';
import { requireAdmin } from '../middleware/authenticate';
import { getStorageSnapshots } from '../services/storage-service';
import { getCustomerWarnings } from '../services/customer-service';

export default async function storageRoutes(fastify: FastifyInstance) {
  // ── GET /api/storage/dashboard ─────────────────
  fastify.get(
    '/api/storage/dashboard',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const snapshots = await getStorageSnapshots(fastify.db);
      const latestSnapshot = snapshots.length > 0 ? snapshots[0] : { total_bytes: 0, total_files: 0 };
      
      const warnings = await getCustomerWarnings(fastify.db);

      return reply.send(success({
        systemTotals: {
          totalBytes: parseInt(latestSnapshot.total_bytes, 10),
          totalFiles: parseInt(latestSnapshot.total_files, 10),
        },
        historicalSnapshots: snapshots,
        nearingLimitCustomers: warnings,
      }));
    }
  );

  // ── DELETE /api/storage/cleanup ────────────────
  fastify.delete(
    '/api/storage/cleanup',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      // In a real implementation, this would query inactive visualizations
      // and issue delete commands to the cloud storage bucket.
      const res = await fastify.db.query(
        `DELETE FROM visualizations WHERE active = false RETURNING id`
      );
      
      return reply.send(success({
        message: 'Cleanup successful',
        deletedCount: res.rowCount ?? 0
      }));
    }
  );
}
