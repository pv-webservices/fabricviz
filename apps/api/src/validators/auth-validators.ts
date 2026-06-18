import { z } from 'zod';

/** POST /api/auth/verify-code */
export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(5, 'Access code must be exactly 5 characters')
    .regex(/^[A-Za-z0-9]{5}$/, 'Access code must be 5 alphanumeric characters'),
  deviceFingerprint: z.string().optional(),
  rememberDevice: z.boolean().optional().default(false),
});
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

/** POST /api/auth/admin-login */
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/** POST /api/auth/logout */
export const logoutSchema = z.object({
  sessionId: z.string().uuid().optional(),
});
export type LogoutInput = z.infer<typeof logoutSchema>;
