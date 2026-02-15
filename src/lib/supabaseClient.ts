// Load environment variables for Node.js scripts (tsx, etc.)
if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.DATABASE_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require('dotenv');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env.local');
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.warn('Warning: Could not load .env.local:', result.error.message);
    }
  } catch {
    // dotenv might not be available
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getDatabaseUrl } from '../../config/deploy-db';
import { createPgSupabaseAdapter } from './db-pg-supabase-adapter';

/** Pakai PostgreSQL langsung bila DATABASE_URL (atau DB_*) diset (mis. di Vercel) */
const databaseUrl = typeof window === 'undefined' ? getDatabaseUrl() : undefined;
const useDirectPg = !!databaseUrl;
if (useDirectPg && typeof window === 'undefined' && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl;
}

/**
 * Client untuk akses data:
 * - Jika DATABASE_URL / DB_* diset (Vercel/deploy): pakai PostgreSQL (pg adapter).
 * - Jika tidak: pakai Supabase (NEXT_PUBLIC_SUPABASE_URL + anon key).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!useDirectPg && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set in .env.local or set DATABASE_URL for deploy.'
  );
}

export const supabase: SupabaseClient = useDirectPg
  ? (createPgSupabaseAdapter() as unknown as SupabaseClient)
  : createClient(supabaseUrl!, supabaseAnonKey!);
