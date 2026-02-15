# Deploy Database (Vercel + PostgreSQL)

Aplikasi pakai **environment variables** untuk koneksi database. Di Vercel, set env di **Project Settings → Environment Variables**.

---

## Environment variables (Vercel)

### Opsi 1: Satu variable (disarankan)

| Variable       | Nilai | Environment  |
|----------------|--------|---------------|
| `DATABASE_URL` | `postgresql://user:password@host:port/database` | Production (dan Preview kalau mau) |

Contoh:
```env
DATABASE_URL=postgresql://creativo:Admin1234%25@115.124.72.218:9999/ai_testing_db
```
*(Karakter `%` di password ditulis `%25` di URL.)*

### Opsi 2: Per komponen

| Variable     | Contoh |
|-------------|--------|
| `DB_HOST`   | `115.124.72.218` |
| `DB_PORT`   | `9999` |
| `DB_USER`   | `creativo` |
| `DB_PASSWORD` | `Admin1234%` |
| `DB_NAME`   | `ai_testing_db` |

Kalau pakai opsi 2, **jangan** set `DATABASE_URL`; URL akan dibangun dari variabel di atas.

---

## Better Auth & URL aplikasi

Di Vercel, set juga:

| Variable | Nilai |
|----------|--------|
| `BETTER_AUTH_URL` | URL production, mis. `https://your-app.vercel.app` |
| `BETTER_AUTH_SECRET` | String acak yang aman |
| `ADMIN_EMAIL` | Email admin (default seed: `admin@skinlab.com`) |
| `ADMIN_PASSWORD` | Password admin (default seed: `admin123`) |

---

## Migrasi & seeder (DB kosong)

**Migrasi + seed + admin** dijalankan otomatis saat **build** jika `DATABASE_URL` (atau `DB_*`) diset di environment. Jadi di Vercel, saat build pertama kali dengan env DB yang sudah benar, tabel akan dibuat dan data akan di-seed.

**Atau jalankan SQL manual** (pgAdmin, DBeaver, Supabase SQL Editor):
- Buka `data/full-setup.sql`
- Execute seluruh file (migrasi + seed dalam satu file)

Kalau build gagal karena DB tidak terjangkau (mis. firewall Vercel → DB), jalankan manual dari lokal:

1. Set env yang sama (mis. di `.env.local`):
   ```env
   DATABASE_URL=postgresql://creativo:Admin1234%25@115.124.72.218:9999/ai_testing_db
   ```
2. Jalankan:
   ```bash
   npm run setup:deploy
   ```
   Ini menjalankan:
   - **Migrasi** (`data/supabase-migration.sql`)
   - **Seeder** (skin types, ingredients, products, rules, sample analysis logs)
   - **Akun admin** (better-auth: email/password dari `ADMIN_EMAIL` / `ADMIN_PASSWORD`, default `admin@skinlab.com` / `admin123`)

Kalau admin sudah ada (email sama), step admin dilewati.

Setelah itu, deploy di Vercel cukup pakai env `DATABASE_URL` (atau `DB_*`); aplikasi akan pakai PostgreSQL dan better-auth ke DB yang sama.

---

## Ringkasan

1. **Vercel:** Tambah `DATABASE_URL` (atau `DB_*`) dan kalau mau ubah default admin: `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
2. **Sekali jalan:** Dari lokal, set env lalu `npm run setup:deploy` → migrasi + seeder + akun admin.
3. **Login admin:** Pakai email/password yang di-seed (default `admin@skinlab.com` / `admin123`) atau yang kamu set di env.
