import crypto from 'node:crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config';
import { success, error } from '../lib/response';
import { authenticate, type CustomerUserTokenPayload, type TokenPayload } from '../middleware/authenticate';
import bcrypt from 'bcrypt';

// Very lightweight validations to match frontend
function validateFullName(val: string) {
  if (!val || val.length < 2 || val.length > 60) return false;
  if (!/^[a-zA-Z\s'-]+$/.test(val)) return false;
  return true;
}

function validateMobile(val: string, countryCode: string) {
  if (!val) return false;
  if (countryCode === '+91') return /^[6-9]\d{9}$/.test(val);
  return /^\d{7,15}$/.test(val);
}

function validateEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function validatePassword(val: string) {
  if (!val || val.length < 8) return false;
  if (!/[A-Z]/.test(val)) return false;
  if (!/[a-z]/.test(val)) return false;
  if (!/[0-9]/.test(val)) return false;
  if (!/[!@#$%^&*_\-]/.test(val)) return false;
  return true;
}

export default async function customerAuthRoutes(fastify: FastifyInstance) {

  // ─────────────────────────────────────────────────
  //  POST /api/auth/customer/register
  // ─────────────────────────────────────────────────
  fastify.post(
    '/api/auth/customer/register',
    { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } },
    async (request: any, reply: any) => {
      const { full_name, email, password, mobile, country_code, company, city } = request.body;

      // Manual Validation
      if (!validateFullName(full_name)) return reply.status(400).send(error('VALIDATION_ERROR', 'Invalid full name'));
      if (!validateEmail(email)) return reply.status(400).send(error('VALIDATION_ERROR', 'Invalid email address'));
      if (!validateMobile(mobile, country_code || '+91')) return reply.status(400).send(error('VALIDATION_ERROR', 'Invalid mobile number'));
      if (!validatePassword(password)) return reply.status(400).send(error('VALIDATION_ERROR', 'Invalid password format'));

      const db = fastify.db;

      // Check email uniqueness
      const existing = await db.query('SELECT id FROM customers WHERE email = $1', [email]);
      if ((existing.rowCount ?? 0) > 0) {
        return reply.status(409).send(error('CONFLICT', 'This email is already registered. Sign in instead.'));
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 12);

      // Insert customer
      const result = await db.query(
        `INSERT INTO customers (full_name, email, password_hash, mobile, country_code, company, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, full_name, email, mobile, country_code, company, city, created_at`,
        [full_name, email, password_hash, mobile, country_code || '+91', company || null, city || null]
      );

      const newCustomer = result.rows[0];

      // Automatically sign in the user
      const payload: CustomerUserTokenPayload = {
        type: 'customer_user',
        customerId: newCustomer.id,
      };
      const token = fastify.jwt.sign(payload, { expiresIn: env.JWT_EXPIRY });



      return reply.send(success({
        token,
        customer: newCustomer
      }));
    }
  );

  // ─────────────────────────────────────────────────
  //  POST /api/auth/customer/login
  // ─────────────────────────────────────────────────
  fastify.post(
    '/api/auth/customer/login',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request: any, reply: any) => {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send(error('VALIDATION_ERROR', 'Email and password required'));
      }

      const result = await fastify.db.query(
        'SELECT * FROM customers WHERE email = $1 AND is_active = true',
        [email]
      );
      const customer = result.rows[0];

      if (!customer) {
        // Generic error
        return reply.status(401).send(error('UNAUTHORIZED', 'Invalid email or password'));
      }

      const valid = await bcrypt.compare(password, customer.password_hash);
      if (!valid) {
        return reply.status(401).send(error('UNAUTHORIZED', 'Invalid email or password'));
      }

      const payload: CustomerUserTokenPayload = {
        type: 'customer_user',
        customerId: customer.id,
      };
      const token = fastify.jwt.sign(payload, { expiresIn: env.JWT_EXPIRY });



      const { password_hash, ...customerData } = customer;

      return reply.send(success({
        token,
        customer: customerData
      }));
    }
  );

  // ─────────────────────────────────────────────────
  //  POST /api/auth/customer/logout
  // ─────────────────────────────────────────────────
  fastify.post(
    '/api/auth/customer/logout',
    async (request: any, reply: any) => {
      return reply.send(success({ success: true }));
    }
  );

  // ─────────────────────────────────────────────────
  //  GET /api/auth/customer/me
  // ─────────────────────────────────────────────────
  fastify.get(
    '/api/auth/customer/me',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const user = request.user as TokenPayload;
      if (user.type !== 'customer_user') {
        return reply.status(403).send(error('FORBIDDEN', 'Customer access required'));
      }

      const result = await fastify.db.query(
        'SELECT id, full_name, email, mobile, country_code, company, city, created_at, is_active, credit_limit, credits_used FROM customers WHERE id = $1',
        [user.customerId]
      );
      
      const customer = result.rows[0];
      if (!customer || !customer.is_active) {
        return reply.status(401).send(error('UNAUTHORIZED', 'Account deactivated'));
      }

      return reply.send(success(customer));
    }
  );

  // ─────────────────────────────────────────────────
  //  POST /api/auth/customer/forgot-password
  // ─────────────────────────────────────────────────
  fastify.post(
    '/api/auth/customer/forgot-password',
    { config: { rateLimit: { max: 3, timeWindow: '15 minutes' } } },
    async (request: any, reply: any) => {
      const { email } = request.body;
      if (!validateEmail(email)) {
        return reply.status(400).send(error('VALIDATION_ERROR', 'Invalid email address'));
      }

      const result = await fastify.db.query('SELECT id FROM customers WHERE email = $1 AND is_active = true', [email]);
      const customer = result.rows[0];

      if (customer) {
        // Create token
        const tokenRes = await fastify.db.query(
          `INSERT INTO customer_reset_tokens (customer_id, expires_at)
           VALUES ($1, NOW() + INTERVAL '1 hour')
           RETURNING token`,
          [customer.id]
        );
        const token = tokenRes.rows[0].token;

        // MOCK EMAIL SEND
        const resetLink = `http://localhost:5173/reset-password?token=${token}`;
        console.log('===================================================');
        console.log('MOCK EMAIL SENT');
        console.log(`To: ${email}`);
        console.log(`Reset Link: ${resetLink}`);
        console.log('===================================================');
      }

      // Always return success
      return reply.send(success({ message: 'If an account exists with this email, you\'ll receive a reset link shortly.' }));
    }
  );

  // ─────────────────────────────────────────────────
  //  GET /api/auth/customer/reset-password/:token
  // ─────────────────────────────────────────────────
  fastify.get(
    '/api/auth/customer/reset-password/:token',
    async (request: any, reply: any) => {
      const { token } = request.params;

      const result = await fastify.db.query(
        'SELECT id, expires_at, used FROM customer_reset_tokens WHERE token = $1',
        [token]
      );
      const resetReq = result.rows[0];

      if (!resetReq || resetReq.used || new Date() > new Date(resetReq.expires_at)) {
        return reply.status(400).send(error('INVALID_TOKEN', 'Link expired or invalid'));
      }

      return reply.send(success({ valid: true }));
    }
  );

  // ─────────────────────────────────────────────────
  //  POST /api/auth/customer/reset-password
  // ─────────────────────────────────────────────────
  fastify.post(
    '/api/auth/customer/reset-password',
    async (request: any, reply: any) => {
      const { token, new_password } = request.body;

      if (!validatePassword(new_password)) {
        return reply.status(400).send(error('VALIDATION_ERROR', 'Invalid password format'));
      }

      const result = await fastify.db.query(
        'SELECT customer_id, expires_at, used FROM customer_reset_tokens WHERE token = $1 FOR UPDATE',
        [token]
      );
      const resetReq = result.rows[0];

      if (!resetReq || resetReq.used || new Date() > new Date(resetReq.expires_at)) {
        return reply.status(400).send(error('INVALID_TOKEN', 'Link expired or invalid'));
      }

      const password_hash = await bcrypt.hash(new_password, 12);

      await fastify.db.query(
        'UPDATE customers SET password_hash = $1 WHERE id = $2',
        [password_hash, resetReq.customer_id]
      );

      await fastify.db.query(
        'UPDATE customer_reset_tokens SET used = true WHERE token = $1',
        [token]
      );

      return reply.send(success({ success: true }));
    }
  );

  // ─────────────────────────────────────────────────
  //  GET /api/customer/favorites
  // ─────────────────────────────────────────────────
  fastify.get(
    '/api/customer/favorites',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const user = request.user as TokenPayload;
      if (user.type !== 'customer_user') {
        return reply.status(403).send(error('FORBIDDEN', 'Customer access required'));
      }

      const result = await fastify.db.query(`
        SELECT f.id, f.name as title, COALESCE(f.swatch_url, f.texture_url) as image_url, c.name as collection_name, f.code, f.end_use as category
        FROM fabrics f
        JOIN customer_favorites cf ON f.id = cf.fabric_id
        LEFT JOIN collections c ON f.collection_id = c.id
        WHERE cf.customer_id = $1
        ORDER BY cf.created_at DESC
      `, [user.customerId]);

      return reply.send(success(result.rows));
    }
  );

  // ─────────────────────────────────────────────────
  //  POST /api/customer/favorites/:fabricId
  // ─────────────────────────────────────────────────
  fastify.post(
    '/api/customer/favorites/:fabricId',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const user = request.user as TokenPayload;
      if (user.type !== 'customer_user') {
        return reply.status(403).send(error('FORBIDDEN', 'Customer access required'));
      }

      const { fabricId } = request.params;

      await fastify.db.query(
        `INSERT INTO customer_favorites (customer_id, fabric_id)
         VALUES ($1, $2)
         ON CONFLICT (customer_id, fabric_id) DO NOTHING`,
        [user.customerId, fabricId]
      );

      return reply.send(success({ success: true, fabric_id: fabricId }));
    }
  );

  // ─────────────────────────────────────────────────
  //  DELETE /api/customer/favorites/:fabricId
  // ─────────────────────────────────────────────────
  fastify.delete(
    '/api/customer/favorites/:fabricId',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const user = request.user as TokenPayload;
      if (user.type !== 'customer_user') {
        return reply.status(403).send(error('FORBIDDEN', 'Customer access required'));
      }

      const { fabricId } = request.params;

      await fastify.db.query(
        'DELETE FROM customer_favorites WHERE customer_id = $1 AND fabric_id = $2',
        [user.customerId, fabricId]
      );

      return reply.send(success({ success: true, fabric_id: fabricId }));
    }
  );

}
