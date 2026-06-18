import { z } from 'zod';

export const trackEventSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  fabricId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  visualizationId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional().default({}),
});
export type TrackEventInput = z.infer<typeof trackEventSchema>;
