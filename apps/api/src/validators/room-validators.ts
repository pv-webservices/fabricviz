import { z } from 'zod';

const roomEndUseEnum = z.enum(['sofa', 'curtain', 'rug', 'wallpaper', 'both']);

export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  imageUrl: z.string().min(1, 'Image URL is required'),
  thumbnailUrl: z.string().optional(),
  endUse: roomEndUseEnum,
  displayOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema.partial();
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

export const roomQuerySchema = z.object({
  endUse: roomEndUseEnum.optional(),
  active: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : v, z.boolean().optional()),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type RoomQueryInput = z.infer<typeof roomQuerySchema>;
