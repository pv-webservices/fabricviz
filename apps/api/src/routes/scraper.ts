import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { success, error } from '../lib/response';
import { requireAdmin } from '../middleware/authenticate';
import { z } from 'zod';
import { scrapeShopaccinoUrl } from '../services/scraper-service';

const scrapeSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

export default async function scraperRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/scraper/scrape',
    { preHandler: [requireAdmin] },
    async (request: any, reply: any) => {
      const parsed = scrapeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
      }

      try {
        const fabrics = await scrapeShopaccinoUrl(parsed.data.url);
        return reply.send(success({ fabrics }));
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send(error('SCRAPE_ERROR', err.message || 'Failed to scrape URL'));
      }
    },
  );
}
