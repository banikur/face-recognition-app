/**
 * Buat admin user di tabel admin_users.
 * Password di-hash dengan bcrypt.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { getDatabaseUrl } from '../config/deploy-db';

config({ path: resolve(process.cwd(), '.env.local') });

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@skinlab.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const url = getDatabaseUrl();

  if (!url) {
    console.error('❌ Set DATABASE_URL atau DB_* di env.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [email.toLowerCase(), hash]
    );
    console.log('✅ Admin dibuat:', email);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
