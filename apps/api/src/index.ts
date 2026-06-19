import Fastify from 'fastify';
import { env } from './config';
import corsPlugin from './plugins/cors';
import jwtPlugin from './plugins/jwt';
import dbPlugin from './plugins/database';
import redisPlugin from './plugins/redis';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import collectionRoutes from './routes/collections';
import fabricRoutes from './routes/fabrics';
import roomRoutes from './routes/rooms';
import accessCodeRoutes from './routes/access-codes';
import requestRoutes from './routes/requests';
import analyticsRoutes from './routes/analytics';
import qrRoutes from './routes/qr';
import renderRoutes from './routes/renders';
import uploadRoutes from './routes/uploads';
import historyRoutes from './routes/history';
import downloadRoutes from './routes/downloads';
import storageRoutes from './routes/storage';
import resultRoutes from './routes/results';
import customerRoutes from './routes/customers';
import creditRoutes from './routes/credits';
import settingsRoutes from './routes/settings';

import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';

const fastify = Fastify({ logger: true });

async function start() {
  try {
    // Register plugins
    await fastify.register(corsPlugin);
    await fastify.register(jwtPlugin);
    
    await fastify.register(fastifyRateLimit, {
      max: 200, // Global limit: 200 requests per 1 min
      timeWindow: '1 minute'
    });

    await fastify.register(fastifyMultipart, {
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      }
    });

    // Serve local uploads when STORAGE_MODE is local
    await fastify.register(require('@fastify/static'), {
      root: require('path').resolve(process.env.LOCAL_UPLOAD_DIR || './uploads'),
      prefix: '/uploads/',
    });

    await fastify.register(dbPlugin);
    await fastify.register(redisPlugin);

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(authRoutes);
    await fastify.register(collectionRoutes);
    await fastify.register(fabricRoutes);
    await fastify.register(roomRoutes);
    await fastify.register(accessCodeRoutes);
    await fastify.register(requestRoutes);
    await fastify.register(analyticsRoutes);
    await fastify.register(qrRoutes);
    await fastify.register(renderRoutes);
    await fastify.register(uploadRoutes);
    await fastify.register(historyRoutes);
    await fastify.register(downloadRoutes);
    await fastify.register(storageRoutes);
    await fastify.register(resultRoutes);
    await fastify.register(customerRoutes);
    await fastify.register(creditRoutes);
    await fastify.register(settingsRoutes);

    const port = env.PORT;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`API Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
