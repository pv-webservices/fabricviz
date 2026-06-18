import { describe, it, expect } from 'vitest';
import {
  createAccessCodeSchema,
  updateAccessCodeSchema,
  accessCodeQuerySchema,
} from '../validators/access-code-validators';
import {
  createRequestSchema,
  updateRequestStatusSchema,
  requestQuerySchema,
} from '../validators/request-validators';
import { trackEventSchema } from '../validators/analytics-validators';

// ─────────────────────────────────────────────────
//  Access Code validators
// ─────────────────────────────────────────────────
describe('createAccessCodeSchema', () => {
  it('should accept valid explicit code', () => {
    const result = createAccessCodeSchema.safeParse({
      code: 'A1B2C',
      customerName: 'Test',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid code length', () => {
    const result = createAccessCodeSchema.safeParse({ code: 'SHORT' });
    // 'SHORT' is 5 chars, so it should be valid! Wait, let's test a 4 char one.
    const result2 = createAccessCodeSchema.safeParse({ code: 'ABCD' });
    expect(result2.success).toBe(false);
  });

  it('should default creditLimit and active', () => {
    const result = createAccessCodeSchema.safeParse({ customerName: 'No Code' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
      expect(result.data.creditLimit).toBe(100);
      expect(result.data.code).toBeUndefined(); // handled by service
    }
  });
});

describe('accessCodeQuerySchema', () => {
  it('should parse boolean string', () => {
    const result = accessCodeQuerySchema.safeParse({ active: 'false' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────
//  Request validators
// ─────────────────────────────────────────────────
describe('createRequestSchema', () => {
  it('should accept valid quote request', () => {
    const result = createRequestSchema.safeParse({
      type: 'quote_request',
      name: 'John Doe',
      email: 'john@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid request type', () => {
    const result = createRequestSchema.safeParse({ type: 'invalid_type' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = createRequestSchema.safeParse({
      type: 'sample_request',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateRequestStatusSchema', () => {
  it('should accept valid status', () => {
    const result = updateRequestStatusSchema.safeParse({ status: 'approved' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = updateRequestStatusSchema.safeParse({ status: 'done' });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────
//  Analytics validators
// ─────────────────────────────────────────────────
describe('trackEventSchema', () => {
  it('should accept valid event', () => {
    const result = trackEventSchema.safeParse({
      eventName: 'page_view',
      metadata: { path: '/home' },
    });
    expect(result.success).toBe(true);
  });

  it('should require eventName', () => {
    const result = trackEventSchema.safeParse({ metadata: {} });
    expect(result.success).toBe(false);
  });
});
