import { z } from 'zod';

export const envSchema = {
  VITE_COUNTER: z.preprocess((value: string) => +value, z.number()).optional(),
  VITE_API_BASE_URL: z.string().url(),
  VITE_SKIP_AUTH: z.preprocess(
    (v: string | undefined) => (v === 'true' ? true : false),
    z.boolean().optional()
  ),
};
