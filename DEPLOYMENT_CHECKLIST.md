# Deployment Checklist untuk Vercel

## ✅ Pre-Deployment Security

### 1. Environment Variables
Pastikan semua environment variables diset di Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `DATABASE_URL` - PostgreSQL connection string (untuk better-auth)
- `BETTER_AUTH_SECRET` - Random secure string
- `BETTER_AUTH_URL` - Production URL (misal: https://your-app.vercel.app)
- `ADMIN_EMAIL` - Admin email
- `ADMIN_PASSWORD` - Strong password untuk admin

### 2. File yang Sudah Dihapus (Tidak Akan Ter-commit)
- ✅ `data/database.db` - SQLite database file
- ✅ `data/database.db-shm` - SQLite shared memory
- ✅ `data/database.db-wal` - SQLite write-ahead log
- ✅ `data/auth.db` - SQLite auth database
- ✅ `data/backups/*` - Backup files
- ✅ `data/schema.sql` - SQLite schema (tidak digunakan lagi)

### 3. File yang Ter-ignore oleh Git
File-file berikut sudah di-ignore dan tidak akan ter-commit:
- `.env.local` - Local environment variables
- `.env.*` - Semua file environment
- `*.db`, `*.db-shm`, `*.db-wal` - Database files
- `.cert/` - SSL certificates
- `*.pem`, `*.key` - Certificate files
- `node_modules/` - Dependencies
- `.next/` - Build output

### 4. Hardcoded Credentials
✅ Semua credentials sudah dipindahkan ke environment variables:
- Admin password: Menggunakan `ADMIN_PASSWORD` env var
- Database connection: Menggunakan `DATABASE_URL` env var
- Supabase keys: Menggunakan environment variables

### 5. Scripts yang Aman untuk Production
- ✅ `npm run build` - Build untuk production
- ✅ `npm run start` - Start production server
- ✅ `npm run inject-data` - Seed data (hanya untuk setup awal)
- ✅ `npm run check-seed` - Check seed data
- ✅ `npm run create-admin` - Create admin user (menggunakan env vars)

### 6. Scripts Development (Tidak Digunakan di Production)
- `npm run dev` - Development server
- `npm run dev:https` - HTTPS development server
- `npm run setup:https` - Setup SSL certificates
- `npm run init-db` - Database initialization (hanya dokumentasi)

## 🚀 Deployment Steps

1. **Setup Supabase**
   - Buat project di https://supabase.com
   - Jalankan `data/supabase-migration.sql` di SQL Editor
   - Dapatkan URL dan anon key

2. **Setup Vercel Environment Variables**
   - Buka Vercel Dashboard → Project Settings → Environment Variables
   - Tambahkan semua environment variables dari `env.example`

3. **Deploy ke Vercel**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin master
   ```

4. **Post-Deployment**
   - Seed data: Jalankan `npm run inject-data` (atau setup via Supabase dashboard)
   - Create admin: Setup `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di Vercel, lalu jalankan script

## ⚠️ Security Notes

- ✅ Tidak ada hardcoded passwords
- ✅ Tidak ada database files yang ter-commit
- ✅ Environment variables tidak ter-commit
- ✅ SSL certificates tidak ter-commit
- ✅ Backup files tidak ter-commit

## 📝 Files yang Aman untuk Production

Semua file berikut aman dan diperlukan untuk production:
- `src/` - Source code
- `public/` - Static assets
- `data/models.ts` - Database models (menggunakan Supabase)
- `data/supabase-migration.sql` - Migration script (untuk reference)
- `next.config.ts` - Next.js configuration
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration
