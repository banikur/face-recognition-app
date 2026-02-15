import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { getDatabaseUrl } from '../../../../config/deploy-db';
import { createSession } from '@/lib/simple-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib' }, { status: 400 });
    }
    const url = getDatabaseUrl();
    if (!url) {
      return NextResponse.json({ error: 'Database tidak dikonfigurasi' }, { status: 500 });
    }
    const pool = new Pool({ connectionString: url });
    const r = await pool.query(
      'SELECT id, email, password_hash FROM admin_users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    await pool.end();
    const row = r.rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }
    await createSession({ id: row.id, email: row.email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Gagal login' }, { status: 500 });
  }
}
