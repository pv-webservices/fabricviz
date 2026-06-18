import { FastifyRequest, FastifyReply } from 'fastify';
import { error } from '../lib/response';

/**
 * JWT payload shapes for the two token types.
 */
export interface CustomerTokenPayload {
  type: 'customer';
  accessCodeId: string;
  sessionId: string;
  code: string;
  customerName?: string;
}

export interface AdminTokenPayload {
  type: 'admin';
  userId: string;
  email: string;
  role: string;
}

export type TokenPayload = CustomerTokenPayload | AdminTokenPayload;

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

/**
 * Pre-handler hook that verifies the JWT from the Authorization header.
 * Attaches decoded payload to `request.user`.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send(error('UNAUTHORIZED', 'Invalid or expired token'));
  }
}

/**
 * Pre-handler that ensures the caller is an admin user.
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authenticate(request, reply);
  if (reply.sent) return;

  const user = request.user as TokenPayload;
  if (user.type !== 'admin') {
    reply.status(403).send(error('FORBIDDEN', 'Admin access required'));
  }
}
