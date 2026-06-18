import { Queue } from 'bullmq';
import Redis from 'ioredis';

export const QUEUE_NAME = 'render-jobs';

export function getRenderQueue(connection: Redis) {
  return new Queue(QUEUE_NAME, { connection: connection as any });
}
