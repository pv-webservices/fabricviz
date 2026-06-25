import crypto from 'node:crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../config';
import { success, error } from '../lib/response';
import { writeAuditLog } from '../lib/audit';
import {
  verifyCodeSchema,
  adminLoginSchema,
  logoutSchema,
} from '../validators/auth-validators';
import {
  findAccessCodeByCode,
  updateAccessCodeLastUsed,
  createCustomerSession,
  verifyAdminCredentials,
  deleteSession,
  findActiveSessionByDevice,
} from '../services/auth-service';
import {
  authenticate,
  requireAdmin,
  type CustomerTokenPayload,
  type AdminTokenPayload,
  type TokenPayload,
} from '../middleware/authenticate';

/**
 * Compute a Date that is `expiryStr` into the future.
 * Supports "7d", "24h", "60m" formats.
 */
function expiresFromNow(expiryStr: string): Date {
  const match = expiryStr.match(/^(\d+)([dhm])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // fallback 7d
  const num = parseInt(match[1], 10);
  const unit = match[2];
  const ms =
    unit === 'd' ? num * 86_400_000 :
    unit === 'h' ? num * 3_600_000 :
    num * 60_000;
  return new Date(Date.now() + ms);
}

export default async function authRoutes(fastify: FastifyInstance) {

  // ─────────────────────────────────────────────────
  //  POST /api/auth/verify-code
  // ─────────────────────────────────────────────────
  fastify.post(
    '/api/auth/verify-code',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request: any, reply: any) => {
    const parsed = verifyCodeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
    }

    const { code, deviceFingerprint, rememberDevice } = parsed.data;

    const accessCode = await findAccessCodeByCode(fastify.db, code);
    if (!accessCode) {
      return reply.status(401).send(error('INVALID_CODE', 'Access code not found'));
    }
    if (!accessCode.active) {
      return reply.status(403).send(error('CODE_INACTIVE', 'This access code has been deactivated'));
    }

    // Remember-device: reuse existing session if present
    if (rememberDevice && deviceFingerprint) {
      const existing = await findActiveSessionByDevice(
        fastify.db,
        accessCode.id,
        deviceFingerprint,
      );
      if (existing) {
        const payload: CustomerTokenPayload = {
          type: 'customer',
          accessCodeId: accessCode.id,
          sessionId: existing.id,
          code: accessCode.code,
          customerName: accessCode.customer_name ?? undefined,
        };
        const token = fastify.jwt.sign(payload, { expiresIn: env.JWT_EXPIRY });
        await updateAccessCodeLastUsed(fastify.db, accessCode.id);
        return reply.send(
          success({
            token,
            sessionId: existing.id,
            customer: {
              code: accessCode.code,
              name: accessCode.customer_name,
              company: accessCode.company_name,
            },
          }),
        );
      }
    }

    // Create new session
    const expiresAt = expiresFromNow(env.JWT_EXPIRY);
    const tempToken = crypto.randomUUID(); // used as token basis for hashing
    const session = await createCustomerSession(
      fastify.db,
      accessCode.id,
      tempToken,
      deviceFingerprint,
      expiresAt,
    );

    const payload: CustomerTokenPayload = {
      type: 'customer',
      accessCodeId: accessCode.id,
      sessionId: session.id,
      code: accessCode.code,
      customerName: accessCode.customer_name ?? undefined,
    };
    const token = fastify.jwt.sign(payload, { expiresIn: env.JWT_EXPIRY });

    await updateAccessCodeLastUsed(fastify.db, accessCode.id);

    // Audit
    await writeAuditLog(fastify.db, {
      action: 'customer_login',
      entityType: 'access_code',
      entityId: accessCode.id,
      newValue: { code: accessCode.code, rememberDevice },
      ipAddress: request.ip,
    });

    return reply.send(
      success({
        token,
        sessionId: session.id,
        customer: {
          code: accessCode.code,
          name: accessCode.customer_name,
          company: accessCode.company_name,
        },
      }),
    );
  });

  // ─────────────────────────────────────────────────
  //  POST /api/auth/admin-login
  // ─────────────────────────────────────────────────
  fastify.post(
    '/api/auth/admin-login',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request: any, reply: any) => {
    const parsed = adminLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error('VALIDATION_ERROR', parsed.error.issues[0].message));
    }

    const { email, password } = parsed.data;

    const user = await verifyAdminCredentials(fastify.db, email, password);
    if (!user) {
      // Audit failed attempt
      await writeAuditLog(fastify.db, {
        action: 'admin_login_failed',
        entityType: 'user',
        newValue: { email },
        ipAddress: request.ip,
      });
      return reply.status(401).send(error('INVALID_CREDENTIALS', 'Invalid email or password'));
    }

    const payload: AdminTokenPayload = {
      type: 'admin',
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = fastify.jwt.sign(payload, { expiresIn: env.JWT_EXPIRY });

    // Audit success
    await writeAuditLog(fastify.db, {
      userId: user.id,
      action: 'admin_login',
      entityType: 'user',
      entityId: user.id,
      ipAddress: request.ip,
    });

    return reply.send(
      success({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      }),
    );
  });

  // ─────────────────────────────────────────────────
  //  GET /api/auth/me
  // ─────────────────────────────────────────────────
  fastify.get(
    '/api/auth/me',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const user = request.user as TokenPayload;

      if (user.type === 'customer') {
        const ac = await findAccessCodeByCode(fastify.db, user.code);
        return reply.send(
          success({
            type: 'customer',
            code: user.code,
            sessionId: user.sessionId,
            name: ac?.customer_name ?? user.customerName ?? null,
            company: ac?.company_name ?? null,
            featureFlags: ac?.feature_flags ?? [],
          }),
        );
      } else if (user.type === 'admin') {
        // Admin
        return reply.send(
          success({
            type: 'admin',
            userId: user.userId,
            email: user.email,
            role: user.role,
          }),
        );
      }
      
      return reply.status(403).send(error('FORBIDDEN', 'Invalid or unrecognized user type'));
    },
  );

  // ─────────────────────────────────────────────────
  //  POST /api/auth/logout
  // ─────────────────────────────────────────────────
  fastify.post(
    '/api/auth/logout',
    { preHandler: [authenticate] },
    async (request: any, reply: any) => {
      const parsed = logoutSchema.safeParse(request.body);
      const user = request.user as TokenPayload;

      if (user.type === 'customer') {
        const sessionId = parsed.success ? parsed.data.sessionId : user.sessionId;
        if (sessionId) {
          await deleteSession(fastify.db, sessionId);
        }
        await writeAuditLog(fastify.db, {
          action: 'customer_logout',
          entityType: 'customer_session',
          entityId: sessionId,
          ipAddress: request.ip,
        });
      } else if (user.type === 'admin') {
        await writeAuditLog(fastify.db, {
          userId: user.userId,
          action: 'admin_logout',
          entityType: 'user',
          entityId: user.userId,
          ipAddress: request.ip,
        });
      }

      return reply.send(success({ message: 'Logged out successfully' }));
    },
  );
}
