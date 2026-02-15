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

import { createPgSupabaseAdapter } from './db-pg-supabase-adapter';
import { getDatabaseUrl } from '../../config/deploy-db';

// FORCE DIRECT PG CONNECTION
// User provided connection string:
const HARDCODED_DB_URL = 'postgresql://creativo:Admin1234%25@115.124.72.218:9999/ai_testing_db';

if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
  // Check config first
  const configuredUrl = getDatabaseUrl();

  if (configuredUrl) {
    process.env.DATABASE_URL = configuredUrl;
  } else {
    // Fallback to hardcoded URL if env/config missing
    console.log('Using hardcoded DB URL');
    process.env.DATABASE_URL = HARDCODED_DB_URL;
  }
}

// Export adapter as supabase client
// We cast as 'any' to bypass SupabaseClient type check since we are replacing it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createPgSupabaseAdapter() as any;
