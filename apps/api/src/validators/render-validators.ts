import { z } from 'zod';

export const createRenderSchema = z.object({
  fabricId: z.string().uuid('Invalid fabric ID'),
  roomId: z.string().uuid('Invalid room ID').optional(),
  uploadedPhotoUrl: z.string().url('Invalid uploaded photo URL').optional(),
  objectType: z.enum(['sofa', 'curtain', 'rug', 'wallpaper']),
  sourceType: z.enum(['template', 'predefined_room', 'upload', 'camera']),
}).refine(data => data.roomId || data.uploadedPhotoUrl, {
  message: 'Either roomId or uploadedPhotoUrl must be provided',
  path: ['roomId'],
});

export type CreateRenderInput = z.infer<typeof createRenderSchema>;

export const renderStatusQuerySchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});
