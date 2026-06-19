import { z } from 'zod';

const endUseEnum = z.enum(['sofa', 'curtain', 'rug', 'wallpaper', 'both']);

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  groupId: z.string().uuid().optional(),
  endUse: endUseEnum,
  qrCode: z.string().optional(),
  qrUrl: z.string().url().optional().or(z.literal('')),
  active: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = createCollectionSchema.partial();
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export const collectionQuerySchema = z.object({
  endUse: endUseEnum.optional(),
  active: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : v, z.boolean().optional()),
  search: z.string().optional(),
  sortBy: z.enum(['created_at', 'name', 'display_order']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type CollectionQueryInput = z.infer<typeof collectionQuerySchema>;
