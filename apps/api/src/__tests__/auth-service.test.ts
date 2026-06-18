import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/password';
import { success, error } from '../lib/response';
import { verifyCodeSchema, adminLoginSchema, logoutSchema } from '../validators/auth-validators';

// ─────────────────────────────────────────────────
//  Password helpers
// ─────────────────────────────────────────────────
describe('password helpers', () => {
  it('should hash and verify a password correctly', async () => {
    const plain = 'SuperSecret123!';
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});

// ─────────────────────────────────────────────────
//  Response helpers
// ─────────────────────────────────────────────────
describe('response helpers', () => {
  it('success() should return { success: true, data }', () => {
    const res = success({ id: '1' });
    expect(res).toEqual({ success: true, data: { id: '1' } });
  });

  it('error() should return { success: false, error: { code, message } }', () => {
    const res = error('NOT_FOUND', 'Item not found');
    expect(res).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Item not found' },
    });
  });
});

// ─────────────────────────────────────────────────
//  Zod validators
// ─────────────────────────────────────────────────
describe('verifyCodeSchema', () => {
  it('should accept a valid 5-char alphanumeric code', () => {
    const result = verifyCodeSchema.safeParse({ code: 'AB123' });
    expect(result.success).toBe(true);
  });

  it('should reject a 4-char code', () => {
    const result = verifyCodeSchema.safeParse({ code: 'AB12' });
    expect(result.success).toBe(false);
  });

  it('should reject a code with special characters', () => {
    const result = verifyCodeSchema.safeParse({ code: 'AB@#!' });
    expect(result.success).toBe(false);
  });

  it('should accept optional rememberDevice flag', () => {
    const result = verifyCodeSchema.safeParse({
      code: 'XY789',
      rememberDevice: true,
      deviceFingerprint: 'fp-123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberDevice).toBe(true);
    }
  });

  it('should default rememberDevice to false', () => {
    const result = verifyCodeSchema.safeParse({ code: 'AB123' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rememberDevice).toBe(false);
    }
  });
});

describe('adminLoginSchema', () => {
  it('should accept valid email + password', () => {
    const result = adminLoginSchema.safeParse({
      email: 'admin@example.com',
      password: 'secret',
    });
    expect(result.success).toBe(true);
  });

  it('should reject an invalid email', () => {
    const result = adminLoginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret',
    });
    expect(result.success).toBe(false);
  });

  it('should reject an empty password', () => {
    const result = adminLoginSchema.safeParse({
      email: 'admin@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('logoutSchema', () => {
  it('should accept an empty body', () => {
    const result = logoutSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept a valid UUID sessionId', () => {
    const result = logoutSchema.safeParse({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject an invalid sessionId', () => {
    const result = logoutSchema.safeParse({ sessionId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});
