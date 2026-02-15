# Pengecekan Seeder dan Migrasi (Koneksi Supabase)

Ringkasan hasil pengecekan file migrasi dan seeder yang terhubung ke **Supabase** (PostgreSQL).

---

## 1. Koneksi ke Supabase

Koneksi **bukan** di file migration/seeder, melainkan di:

| File | Peran |
|------|--------|
| **`src/lib/supabaseClient.ts`** | Membuat client Supabase dengan `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`. Env di-load dari `.env.local` (untuk script `tsx` juga di-load di sini). |
| **`.env.local`** (referensi: `env.example`) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Untuk better-auth: `DATABASE_URL` (connection string PostgreSQL). |

Migration SQL **tidak** menjalankan koneksi; file SQL itu dijalankan **manual** di Supabase Dashboard → SQL Editor.

---

## 2. File Migrasi

| File | Isi |
|------|-----|
| **`data/supabase-migration.sql`** | Satu skrip SQL untuk membuat semua tabel di Supabase. |

### Tabel yang dibuat (urutan sesuai dependency FK)

| Tabel | Keterangan |
|-------|------------|
| `brands` | Master data brand produk. |
| `product_categories` | Kategori produk. |
| `ingredients` | Bahan dengan bobot w_oily, w_dry, w_normal, w_acne. |
| `recommendations` | Dipakai juga sebagai “skin types” (kolom `condition` = nama tipe kulit). |
| `products` | Produk (FK ke brands, product_categories). |
| `product_ingredients` | Junction many-to-many produk ↔ ingredients. |
| `rules` | Aturan rekomendasi: `skin_type_id` → `recommendations(id)`, `product_id` → `products(id)`. |
| `analysis_logs` | Log hasil analisis (skor, kondisi dominan, recommended_product_ids). |
| `user`, `session`, `account`, `verification` | Tabel auth untuk better-auth. |

Semua pakai `CREATE TABLE IF NOT EXISTS`, jadi aman dijalankan ulang.

---

## 3. File Seeder

| File | Script npm | Peran |
|------|------------|--------|
| **`data/inject-data.ts`** | `npm run inject-data` | Mengisi data awal ke Supabase lewat client (env + `data/models.ts` → Supabase). |

### Urutan dan konsistensi dengan migrasi

1. **Load env**  
   `inject-data.ts` memuat `.env.local` **sebelum** import `./models`, sehingga `supabaseClient` dan model pakai env yang benar.

2. **Skin types**  
   Memanggil `createSkinType(...)`. Di `data/models.ts`, Skin Type adalah lapisan kompatibilitas di atas tabel **`recommendations`**:
   - `createSkinType` → `createRecommendation({ condition: name, title: name, description })`
   - Jadi seeder mengisi tabel **`recommendations`**, bukan tabel terpisah `skin_types`. Sesuai migrasi (hanya ada `recommendations`).

3. **Ingredients**  
   `createIngredient(...)` → insert ke tabel **`ingredients`**. Sesuai migrasi.

4. **Products**  
   `createProduct({ name, description })` → insert ke **`products`** (tanpa `brand_id`, `category_id`, `ingredient_ids`). Di model, semua itu opsional; produk tetap terbentuk dengan `brand_id`/`category_id` null. Sesuai migrasi.

5. **Rules**  
   `createRule({ skin_type_id, product_id, confidence_score })`:
   - `skin_type_id` = ID yang dikembalikan dari `createSkinType` (= ID di **`recommendations`**).
   - `product_id` = ID dari `createProduct` di **`products`**.
   - Tabel **`rules`** di migrasi punya FK ke `recommendations(id)` dan `products(id)`. Konsisten.

6. **Analysis logs**  
   `createAnalysisLog(...)` → insert ke **`analysis_logs`**. Sesuai migrasi.

**Kesimpulan:** Seeder dan migrasi **konsisten**; tidak ada tabel atau kolom yang dipakai seeder tapi belum ada di migrasi.

---

## 4. Pengecekan Seed (`check-seed`)

| File | Script npm | Peran |
|------|------------|--------|
| **`data/check-seed.ts`** | `npm run check-seed` | Mengecek apakah data seed sudah ada di Supabase (memanggil model yang baca dari Supabase). |

- Load `.env.local` dulu, lalu import `./models`.
- Memanggil: `getAllSkinTypes`, `getAllIngredients`, `getAllProducts`, `getAllRules`, `getAllAnalysisLogs`.
- Di model:
  - `getAllSkinTypes` → baca dari **`recommendations`** (dipetakan ke SkinType).
  - `getAllRules` → baca dari **`rules`**.
- Mengharapkan minimal: 5 skin types, 9 ingredients, 5 products, 5 rules, 5 analysis logs. Sesuai dengan yang di-inject oleh `inject-data.ts`.

Jika tabel belum ada (misalnya migrasi belum dijalankan), error dari Supabase akan tertangkap dan skrip menyarankan untuk menjalankan `data/supabase-migration.sql` lalu `npm run inject-data`.

---

## 5. Inisialisasi DB (`init.ts`)

| File | Script npm | Peran |
|------|------------|--------|
| **`data/init.ts`** | `npm run init-db` | Hanya menampilkan instruksi; **tidak** menjalankan SQL atau koneksi ke DB. |

Instruksi yang ditampilkan:

1. Buat project di Supabase.
2. Jalankan **`data/supabase-migration.sql`** di Supabase SQL Editor.
3. Set env di `.env.local` (termasuk `NEXT_PUBLIC_SUPABASE_*`).
4. (Opsional) Seeding: **`npm run inject-data`**.

---

## 6. Ringkasan Alur yang Benar

1. **Supabase:** Buat project, dapat URL + anon key (dan kalau pakai better-auth: connection string DB).
2. **Env:** Isi `.env.local` (lihat `env.example`).
3. **Migrasi:** Copy-paste isi **`data/supabase-migration.sql`** ke Supabase SQL Editor → Execute.
4. **Seeder:** Jalankan **`npm run inject-data`** (koneksi ke Supabase lewat client di `src/lib/supabaseClient.ts` + env).
5. **Cek:** **`npm run check-seed`** untuk memastikan data seed terbaca.

Tidak ada file migrasi/seeder lain yang mengatur koneksi; koneksi ke Supabase hanya lewat env dan **`src/lib/supabaseClient.ts`**, dan migration SQL dijalankan manual di Supabase.
