import Redis from 'ioredis';
import { Pool } from 'pg';
import { setupRenderWorker } from './workers/render-worker';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fabricviz:password@localhost:5432/fabricviz',
});

async function start() {
  console.log('Worker starting...');
  const worker = setupRenderWorker(connection, db);

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down worker...');
    await worker.close();
    await db.end();
    process.exit(0);
  });
}

start().catch(console.error);
