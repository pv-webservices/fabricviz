import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRY: z.string().default('7d'),
  ADMIN_JWT_SECRET: z.string(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
