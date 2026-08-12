import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.ts';

// Single shared client, server-side only, anon key. RLS on the Supabase
// side is the real security boundary — this app never holds or uses a
// service-role key. Every query this app makes to Supabase goes through
// this one instance (see server/services/marketService.ts), never
// instantiated per-request or per-component.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
