// Load environment variables for Node.js scripts (tsx, etc.)
// Next.js automatically loads .env.local, but tsx doesn't
if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
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
  } catch (error) {
    // dotenv might not be available, that's okay for Next.js runtime
    console.warn('Warning: Could not load dotenv:', error);
  }
}

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Public Supabase client
 * - Safe for browser & client components
 * - Uses anon key only
 * - Fails fast if env vars are missing
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL. Set it in .env.local and Vercel env.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set it in .env.local and Vercel env.'
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);
