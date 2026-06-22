import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAdmin } from '../middleware/authenticate';

export default async function homepageRoutes(fastify: FastifyInstance) {
  // GET /api/homepage/:section
  // Public route to fetch a specific homepage section's content
  fastify.get('/homepage/:section', async (req: FastifyRequest<{ Params: { section: string } }>, reply: FastifyReply) => {
    const { section } = req.params;
    
    try {
      const res = await fastify.db.query(
        'SELECT data FROM homepage_content WHERE section_name = $1',
        [section]
      );
      
      if (res.rows.length === 0) {
        return reply.code(404).send({ error: 'Section not found' });
      }
      
      return reply.send(res.rows[0].data);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/homepage/:section
  // Protected route to update a specific homepage section's content
  fastify.put('/homepage/:section', { preHandler: [requireAdmin] }, async (req: FastifyRequest<{ Params: { section: string }, Body: any }>, reply: FastifyReply) => {
    const { section } = req.params;
    const body = req.body;
    
    try {
      const res = await fastify.db.query(
        `INSERT INTO homepage_content (section_name, data) 
         VALUES ($1, $2)
         ON CONFLICT (section_name) 
         DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
         RETURNING data`,
        [section, JSON.stringify(body)]
      );
      
      return reply.send({ success: true, data: res.rows[0].data });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
}
