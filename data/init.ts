/**
 * Database Initialization Note
 * 
 * This project now uses Supabase (PostgreSQL) instead of SQLite.
 * 
 * To initialize the database:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Run the SQL migration script in Supabase SQL Editor:
 *    - Open data/supabase-migration.sql
 *    - Copy and paste into Supabase SQL Editor
 *    - Execute the script
 * 
 * 3. Set environment variables in .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
 * 
 * 4. Run data seeding (optional):
 *    npm run inject-data
 * 
 * Note: The old SQLite initialization script is no longer used.
 * All database operations now go through Supabase client.
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

console.log('📝 Database initialization note:');
console.log('   This project uses Supabase (PostgreSQL)');
console.log('   Please run data/supabase-migration.sql in Supabase SQL Editor');
console.log('   See data/init.ts for instructions\n');
