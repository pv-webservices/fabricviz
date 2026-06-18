import fp from 'fastify-plugin';
import { Pool } from 'pg';
import { env } from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    db: Pool;
  }
}

export default fp(async (fastify) => {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  fastify.decorate('db', pool);

  fastify.addHook('onClose', async (instance) => {
    await instance.db.end();
  });
});
