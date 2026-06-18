import { z } from 'zod';

export const createAccessCodeSchema = z.object({
  code: z.string().length(5, 'Code must be exactly 5 characters').optional(),
  customerName: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  creditLimit: z.number().int().nonnegative().optional().default(100),
  active: z.boolean().optional().default(true),
});
export type CreateAccessCodeInput = z.infer<typeof createAccessCodeSchema>;

export const updateAccessCodeSchema = createAccessCodeSchema.partial();
export type UpdateAccessCodeInput = z.infer<typeof updateAccessCodeSchema>;

export const accessCodeQuerySchema = z.object({
  active: z.preprocess((v) => v === 'true' ? true : v === 'false' ? false : v, z.boolean().optional()),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type AccessCodeQueryInput = z.infer<typeof accessCodeQuerySchema>;
