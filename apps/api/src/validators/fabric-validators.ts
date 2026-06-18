import { z } from 'zod';

const endUseEnum = z.enum(['sofa', 'curtain', 'rug', 'wallpaper', 'both']);

const featureFlagsSchema = z.object({
  highMartindale: z.boolean().optional(),
  fadeResistant: z.boolean().optional(),
  waterRepellent: z.boolean().optional(),
  stainRepellent: z.boolean().optional(),
  antimicrobial: z.boolean().optional(),
  premiumQuality: z.boolean().optional(),
}).optional().default({});

export const createFabricSchema = z.object({
  collectionId: z.string().uuid('Invalid collection ID'),
  name: z.string().min(1, 'Fabric name is required'),
  code: z.string().min(1, 'Fabric code is required'),
  swatchUrl: z.string().optional(),
  textureUrl: z.string().optional(),
  colorFamily: z.string().optional(),
  quality: z.string().optional(),
  tags: z.array(z.string()).optional(),
  endUse: endUseEnum,
  repeatWidthMm: z.number().positive().optional(),
  repeatHeightMm: z.number().positive().optional(),
  fabricWidthCm: z.number().positive().optional(),
  priceInr: z.number().nonnegative().optional(),
  featureFlags: featureFlagsSchema,
  active: z.boolean().optional().default(true),
});
export type CreateFabricInput = z.infer<typeof createFabricSchema>;

export const updateFabricSchema = createFabricSchema.partial();
export type UpdateFabricInput = z.infer<typeof updateFabricSchema>;

export const fabricQuerySchema = z.object({
  collectionId: z.string().uuid().optional(),
  endUse: endUseEnum.optional(),
  colorFamily: z.string().optional(),
  quality: z.string().optional(),
  search: z.string().optional(),
  active: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : v, z.boolean().optional()),
  tags: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type FabricQueryInput = z.infer<typeof fabricQuerySchema>;

export const bulkImportRowSchema = z.object({
  collectionId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  endUse: endUseEnum,
  swatchUrl: z.string().optional(),
  textureUrl: z.string().optional(),
  colorFamily: z.string().optional(),
  quality: z.string().optional(),
  tags: z.array(z.string()).optional(),
  repeatWidthMm: z.number().positive().optional(),
  repeatHeightMm: z.number().positive().optional(),
  fabricWidthCm: z.number().positive().optional(),
  priceInr: z.number().nonnegative().optional(),
  featureFlags: featureFlagsSchema,
  active: z.boolean().optional().default(true),
});

export const bulkImportSchema = z.object({
  fabrics: z.array(bulkImportRowSchema).min(1, 'At least one fabric is required'),
});
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
