import { z } from 'zod';

export const createRequestSchema = z.object({
  type: z.enum(['access_code_request', 'quote_request', 'sample_request', 'credit_request']),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  fabricId: z.string().uuid().optional(),
  visualizationId: z.string().uuid().optional(),
  message: z.string().optional(),
  accessCodeId: z.string().uuid().optional(),
});
export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const updateRequestSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  adminNotes: z.string().optional(),
});
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

export const requestQuerySchema = z.object({
  type: z.enum(['access_code_request', 'quote_request', 'sample_request', 'credit_request']).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
export type RequestQueryInput = z.infer<typeof requestQuerySchema>;
