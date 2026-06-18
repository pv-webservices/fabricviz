import { FastifyInstance } from 'fastify';

const APP_VERSION = process.env.npm_package_version || '0.0.0';
const startTime = Date.now();

interface ComponentStatus {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (_request, reply) => {
    const components: Record<string, ComponentStatus> = {};
    let overallStatus: 'ok' | 'degraded' = 'ok';

    // --- PostgreSQL check ---
    try {
      const pgStart = Date.now();
      await fastify.db.query('SELECT 1');
      components.postgres = { status: 'up', latencyMs: Date.now() - pgStart };
    } catch (err: any) {
      overallStatus = 'degraded';
      components.postgres = { status: 'down', error: err?.message ?? 'Unknown error' };
    }

    // --- Redis check ---
    try {
      const redisStart = Date.now();
      await fastify.redis.ping();
      components.redis = { status: 'up', latencyMs: Date.now() - redisStart };
    } catch (err: any) {
      overallStatus = 'degraded';
      components.redis = { status: 'down', error: err?.message ?? 'Unknown error' };
    }

    const statusCode = overallStatus === 'ok' ? 200 : 503;

    return reply.status(statusCode).send({
      status: overallStatus,
      version: APP_VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      components,
    });
  });
}
