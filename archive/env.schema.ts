// src/env.schema.ts
import { z } from 'zod';

export const envSchema = z.object({
  VITE_COUNTER: z
    .preprocess((v) => (typeof v === 'string' ? +v : v), z.number())
    .optional(),
  VITE_API_BASE_URL: z.string().url(),
  VITE_COGNITO_REGION: z.string(),
  VITE_COGNITO_POOL_ID: z.string(),
  VITE_COGNITO_WEB_CLIENT: z.string(),
  VITE_SKIP_AUTH: z
    .preprocess((v) => v === 'true' || v === true, z.boolean())
    .default(false),
});
