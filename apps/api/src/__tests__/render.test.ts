import { describe, it, expect } from 'vitest';
import { createRenderSchema, renderStatusQuerySchema } from '../validators/render-validators';

// ─────────────────────────────────────────────────
//  Render validators
// ─────────────────────────────────────────────────
describe('createRenderSchema', () => {
  it('should accept valid request with roomId', () => {
    const result = createRenderSchema.safeParse({
      fabricId: '123e4567-e89b-12d3-a456-426614174000',
      roomId: '987e6543-e21b-12d3-a456-426614174000',
      objectType: 'sofa',
      sourceType: 'predefined_room',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid request with uploadedPhotoUrl', () => {
    const result = createRenderSchema.safeParse({
      fabricId: '123e4567-e89b-12d3-a456-426614174000',
      uploadedPhotoUrl: 'https://example.com/photo.jpg',
      objectType: 'curtain',
      sourceType: 'upload',
    });
    expect(result.success).toBe(true);
  });

  it('should reject request missing both roomId and uploadedPhotoUrl', () => {
    const result = createRenderSchema.safeParse({
      fabricId: '123e4567-e89b-12d3-a456-426614174000',
      objectType: 'sofa',
      sourceType: 'predefined_room',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid objectType', () => {
    const result = createRenderSchema.safeParse({
      fabricId: '123e4567-e89b-12d3-a456-426614174000',
      roomId: '987e6543-e21b-12d3-a456-426614174000',
      objectType: 'chair', // Invalid
      sourceType: 'predefined_room',
    });
    expect(result.success).toBe(false);
  });
});

describe('renderStatusQuerySchema', () => {
  it('should accept valid UUID', () => {
    const result = renderStatusQuerySchema.safeParse({
      jobId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const result = renderStatusQuerySchema.safeParse({
      jobId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});
