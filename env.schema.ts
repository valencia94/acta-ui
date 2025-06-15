import { z } from 'zod';

export const envSchema = {
  VITE_COUNTER: z.preprocess((value: string) => +value, z.number()).optional(),
  VITE_API_BASE_URL: z.string().url(),
  VITE_COGNITO_REGION: z.string(),
  VITE_COGNITO_POOL_ID: z.string(),
  VITE_COGNITO_WEB_CLIENT: z.string(),
};
