import { describe, it, expect } from 'vitest';
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionQuerySchema,
} from '../validators/collection-validators';
import {
  createFabricSchema,
  updateFabricSchema,
  fabricQuerySchema,
  bulkImportSchema,
} from '../validators/fabric-validators';
import {
  createRoomSchema,
  updateRoomSchema,
  roomQuerySchema,
} from '../validators/room-validators';

// ─────────────────────────────────────────────────
//  Collection validators
// ─────────────────────────────────────────────────
describe('createCollectionSchema', () => {
  it('should accept valid input', () => {
    const result = createCollectionSchema.safeParse({
      name: 'Summer Collection',
      endUse: 'sofa',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing name', () => {
    const result = createCollectionSchema.safeParse({ endUse: 'sofa' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid endUse', () => {
    const result = createCollectionSchema.safeParse({ name: 'Test', endUse: 'chair' });
    expect(result.success).toBe(false);
  });

  it('should default active to true and displayOrder to 0', () => {
    const result = createCollectionSchema.safeParse({ name: 'Test', endUse: 'curtain' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
      expect(result.data.displayOrder).toBe(0);
    }
  });
});

describe('collectionQuerySchema', () => {
  it('should accept empty query', () => {
    const result = collectionQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should parse string booleans for active', () => {
    const result = collectionQuerySchema.safeParse({ active: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.active).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────
//  Fabric validators
// ─────────────────────────────────────────────────
describe('createFabricSchema', () => {
  it('should accept valid full input', () => {
    const result = createFabricSchema.safeParse({
      collectionId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Velvet Royal',
      code: 'VR-001',
      endUse: 'sofa',
      colorFamily: 'Blue',
      quality: 'Premium',
      tags: ['velvet', 'luxury'],
      repeatWidthMm: 64,
      repeatHeightMm: 64,
      fabricWidthCm: 140,
      priceInr: 2500,
      featureFlags: { highMartindale: true, fadeResistant: true },
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing collection ID', () => {
    const result = createFabricSchema.safeParse({
      name: 'Test', code: 'T1', endUse: 'sofa',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID for collectionId', () => {
    const result = createFabricSchema.safeParse({
      collectionId: 'not-a-uuid', name: 'Test', code: 'T1', endUse: 'sofa',
    });
    expect(result.success).toBe(false);
  });
});

describe('fabricQuerySchema', () => {
  it('should accept comma-separated tags', () => {
    const result = fabricQuerySchema.safeParse({ tags: 'velvet,luxury' });
    expect(result.success).toBe(true);
  });
});

describe('bulkImportSchema', () => {
  it('should accept valid array of fabrics', () => {
    const result = bulkImportSchema.safeParse({
      fabrics: [
        {
          collectionId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Fabric A',
          code: 'FA-001',
          endUse: 'sofa',
        },
        {
          collectionId: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Fabric B',
          code: 'FB-002',
          endUse: 'curtain',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty fabrics array', () => {
    const result = bulkImportSchema.safeParse({ fabrics: [] });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────
//  Room validators
// ─────────────────────────────────────────────────
describe('createRoomSchema', () => {
  it('should accept valid input', () => {
    const result = createRoomSchema.safeParse({
      name: 'Modern Living Room',
      imageUrl: 'https://example.com/room.jpg',
      endUse: 'both',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing imageUrl', () => {
    const result = createRoomSchema.safeParse({
      name: 'Test Room',
      endUse: 'sofa',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid endUse for rooms (no rug/wallpaper)', () => {
    const result = createRoomSchema.safeParse({
      name: 'Test',
      imageUrl: 'https://example.com/img.jpg',
      endUse: 'rug',
    });
    expect(result.success).toBe(false);
  });

  it('should default displayOrder and active', () => {
    const result = createRoomSchema.safeParse({
      name: 'Room',
      imageUrl: '/img.jpg',
      endUse: 'curtain',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayOrder).toBe(0);
      expect(result.data.active).toBe(true);
    }
  });
});

describe('roomQuerySchema', () => {
  it('should accept endUse filter', () => {
    const result = roomQuerySchema.safeParse({ endUse: 'sofa' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid room endUse', () => {
    const result = roomQuerySchema.safeParse({ endUse: 'wallpaper' });
    expect(result.success).toBe(false);
  });
});
