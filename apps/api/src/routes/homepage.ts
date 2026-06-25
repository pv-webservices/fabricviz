import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAdmin } from '../middleware/authenticate';

export default async function homepageRoutes(fastify: FastifyInstance) {
  // GET /api/homepage/:section
  // Public route to fetch a specific homepage section's content
  fastify.get('/api/homepage/:section', async (req: FastifyRequest<{ Params: { section: string } }>, reply: FastifyReply) => {
    const { section } = req.params;
    
    try {
      const res = await fastify.db.query(
        'SELECT data FROM homepage_content WHERE section_name = $1',
        [section]
      );
      
      if (res.rows.length === 0) {
        return reply.code(404).send({ error: 'Section not found' });
      }
      
      const data = res.rows[0].data;

      // Special handling for new_arrivals to resolve fabrics dynamically
      if (section === 'new_arrivals' && Array.isArray(data.selected_fabric_ids) && data.selected_fabric_ids.length > 0) {
        try {
          const fabricIds = data.selected_fabric_ids;
          const fabricsRes = await fastify.db.query(
            // ROOT CAUSE FIX: Removed c.slug and f.category which didn't exist in schema, causing silent SQL failure and empty fabrics array
            `SELECT f.id, f.name, f.swatch_url, f.texture_url, f.quality, 
                    c.name as collection_name, 
                    f.code, f.color_family, f.end_use, f.tags
             FROM fabrics f
             LEFT JOIN collections c ON f.collection_id = c.id
             WHERE f.id = ANY($1)`,
            [fabricIds]
          );
          
          // Reorder the fetched fabrics based on the order in selected_fabric_ids
          const fabricMap = new Map();
          fabricsRes.rows.forEach((f: any) => fabricMap.set(f.id, f));
          
          const sortedFabrics = fabricIds
            .map((id: string) => fabricMap.get(id))
            .filter((f: any) => !!f)
            .slice(0, 8); // Max 8 fabrics as requested
            
          data.fabrics = sortedFabrics;
        } catch (e) {
          fastify.log.error(e);
          data.fabrics = [];
        }
      }
      
      return reply.send({ success: true, data });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // PUT /api/homepage/:section
  // Protected route to update a specific homepage section's content
  fastify.put<{ Params: { section: string }, Body: any }>('/api/homepage/:section', { preHandler: [requireAdmin] }, async (req, reply) => {
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
