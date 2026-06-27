import { z } from 'zod';

// ── Valid area keys (must exactly match render-prompt-library.ts) ─────────────
const VALID_AREA_KEYS = [
  'sofa_seat',
  'sofa_back',
  'sofa_all',
  'front_curtain',
  'back_curtain',
  'headboard',
  'cushion',
  'rug',
  'floor',
  'accent_wall',
  'all_walls',
] as const;

// ── Per-area assignment schema ────────────────────────────────────────────────
const areaAssignmentSchema = z.object({
  areaKey: z.enum(VALID_AREA_KEYS, {
    errorMap: () => ({ message: `areaKey must be one of: ${VALID_AREA_KEYS.join(', ')}` }),
  }),
  fabricId: z.string().uuid('Invalid fabric ID in area assignment'),
  fabricName: z.string().min(1, 'fabricName is required'),
  fabricCode: z.string().min(1, 'fabricCode is required'),
  fabricColorDescription: z.string().default(''),
  fabricTextureDescription: z.string().default(''),
  fabricImageUrl: z.string().url('Invalid fabric image URL').nullable().default(null),
});

export type AreaAssignmentInput = z.infer<typeof areaAssignmentSchema>;

// ── New multi-area render schema ──────────────────────────────────────────────
const multiAreaRenderSchema = z
  .object({
    // New multi-area fields
    areaAssignments: z
      .array(areaAssignmentSchema)
      .min(1, 'At least one area assignment is required')
      .max(11, 'Maximum of 11 area assignments allowed'),
    model: z.enum(['fast', 'pro']).default('fast'),
    sourceType: z.enum(['predefined_room', 'uploaded_photo']),
    roomId: z.string().uuid('Invalid room ID').optional(),
    uploadedPhotoUrl: z.string().url('Invalid uploaded photo URL').optional(),

    // Legacy fields (kept for backward compat — ignored when areaAssignments present)
    fabricId: z.string().uuid('Invalid fabric ID').optional(),
    objectType: z.enum(['sofa', 'curtain', 'rug', 'wallpaper']).optional(),
  })
  .refine((data) => data.roomId || data.uploadedPhotoUrl, {
    message: 'Either roomId or uploadedPhotoUrl must be provided',
    path: ['roomId'],
  });

// ── Legacy single-fabric schema (backward compat) ─────────────────────────────
const legacyRenderSchema = z
  .object({
    fabricId: z.string().uuid('Invalid fabric ID'),
    roomId: z.string().uuid('Invalid room ID').optional(),
    uploadedPhotoUrl: z.string().url('Invalid uploaded photo URL').optional(),
    objectType: z.enum(['sofa', 'curtain', 'rug', 'wallpaper']),
    sourceType: z.enum(['template', 'predefined_room', 'upload', 'camera', 'uploaded_photo']),
    // New optional fields that can exist in legacy call
    model: z.enum(['fast', 'pro']).default('fast'),
    areaAssignments: z.undefined().optional(),
  })
  .refine((data) => data.roomId || data.uploadedPhotoUrl, {
    message: 'Either roomId or uploadedPhotoUrl must be provided',
    path: ['roomId'],
  });

// ── Unified schema: tries multi-area first, falls back to legacy ──────────────
export const createRenderSchema = z.union([multiAreaRenderSchema, legacyRenderSchema]);

export type CreateRenderInput = z.infer<typeof createRenderSchema>;

// ── Helper: determine if input uses new multi-area flow ───────────────────────
export function isMultiAreaInput(
  data: CreateRenderInput,
): data is z.infer<typeof multiAreaRenderSchema> {
  return (
    'areaAssignments' in data &&
    Array.isArray((data as z.infer<typeof multiAreaRenderSchema>).areaAssignments) &&
    (data as z.infer<typeof multiAreaRenderSchema>).areaAssignments.length > 0
  );
}

export const renderStatusQuerySchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});
