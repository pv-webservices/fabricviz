import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '../config';

export default fp(async (fastify) => {
  fastify.register(cors, {
    origin: env.ALLOWED_ORIGINS.split(','),
  });
});
