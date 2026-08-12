import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(import.meta.dirname, '..', '.env'), quiet: true });

const envSchema = z.object({
  PORT: z.string().default('8787'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required — set it in server/.env'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SESSION_COOKIE_NAME: z.string().default('hp_session'),
  // Anon key only — RLS is the actual security boundary, same as any
  // Supabase client-safe key. Never put a service-role key here.
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL — set it in server/.env'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required — set it in server/.env'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid server environment configuration:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Server cannot start with invalid environment configuration.');
  }
  return parsed.data;
}

export const env = loadEnv();
