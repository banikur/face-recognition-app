# 🔍 Codebase Analysis Report
## Face Analytic — Skin Condition Classification App (TA)

> Analisis menyeluruh sebelum implementasi berdasarkan prompt requirement.  
> Stack aktual: **Next.js 15, React 19, TailwindCSS, PostgreSQL (Supabase/pg), TensorFlow.js, MediaPipe**

---

## 1. PAGES / ROUTES YANG ADA SEKARANG

### Public Routes (tanpa login)

| Route | File | Status | Keterangan |
|---|---|---|---|
| `/` | `src/app/page.tsx` | ✅ Ada & berfungsi | Halaman utama Live Scan |
| `/products` | `src/app/products/page.tsx` | ✅ Ada & berfungsi | Halaman produk publik dengan filter kondisi |
| `/recommendations` | `src/app/recommendations/page.tsx` | ✅ Ada | Rekomendasi berdasarkan `?condition=` query param |
| `/campaign` | `src/app/campaign/page.tsx` | ✅ Ada | Landing page jenis kulit (statis) |
| `/login` | `src/app/login/page.tsx` | ✅ Ada & berfungsi | Halaman login admin |

### Admin Routes (protected — redirect ke `/login` jika belum login)

| Route | File | Status | Keterangan |
|---|---|---|---|
| `/admin` | `src/app/admin/page.tsx` | ✅ Ada | Dashboard overview + KPI cards |
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | ✅ Ada (duplikat?) | Dashboard lama dengan tab Products/Analyses/Reports |
| `/admin/products` | `src/app/admin/products/page.tsx` | ✅ Ada & berfungsi | CRUD produk |
| `/admin/brands` | `src/app/admin/brands/page.tsx` | ✅ Ada & berfungsi | CRUD brand |
| `/admin/categories` | `src/app/admin/categories/page.tsx` | ✅ Ada & berfungsi | CRUD kategori produk |
| `/admin/ingredients` | `src/app/admin/ingredients/page.tsx` | ✅ Ada & berfungsi | CRUD bahan aktif + bobot CNN |
| `/admin/recommendations` | `src/app/admin/recommendations/page.tsx` | ✅ Ada & berfungsi | CRUD teks rekomendasi per kondisi |
| `/admin/rules` | `src/app/admin/rules/page.tsx` | ✅ Ada & berfungsi | CRUD aturan kondisi → produk |
| `/admin/reports` | `src/app/admin/reports/page.tsx` | ⚠️ Parsial | Hanya tabel analysis logs + export Excel/PDF |
| `/admin/export` | `src/app/admin/export/page.tsx` | ✅ Ada | Export CSV, JSON, dll. |
| `/admin/accounts` | `src/app/admin/accounts/page.tsx` | ✅ Ada & berfungsi | CRUD akun admin |

> **Catatan:** Sidebar admin (`AdminSidebar.tsx`) hanya menampilkan: **Dashboard, Reports, Master Produk, Master Kondisi Kulit, Master Akun** — beberapa halaman ada di file tapi tidak muncul di navigasi (brands, categories, ingredients, rules, export).

---

## 2. API ENDPOINTS YANG ADA

### Auth

| Method | Endpoint | Status | Keterangan |
|---|---|---|---|
| `POST` | `/api/login` | ✅ Berfungsi | Login admin via JWT cookie |
| `POST` | `/api/logout` | ✅ Berfungsi | Clear session cookie |
| `GET` | `/api/auth/session` | ✅ Berfungsi | Cek sesi aktif (dipakai middleware) |

### Analysis

| Method | Endpoint | Status | Keterangan |
|---|---|---|---|
| `POST` | `/api/analysis/save-from-scan` | ✅ Berfungsi | Simpan hasil scan, return rekomendasi |
| `GET` | `/api/analysis` | ✅ Ada | Ambil semua logs |
| `GET` | `/api/analysis-logs` | ✅ Ada | Logs dengan filter date/condition |

### Products

| Method | Endpoint | Status | Keterangan |
|---|---|---|---|
| `GET` | `/api/products` | ✅ Berfungsi | Daftar produk (enriched dengan brand + ingredients) |
| `POST` | `/api/products` | ✅ Ada | Buat produk baru |
| `GET/PUT/DELETE` | `/api/products/[id]` | ✅ Ada | Operasi per produk |

### Reports / Export

| Method | Endpoint | Status | Keterangan |
|---|---|---|---|
| `GET` | `/api/reports/summary` | ✅ Ada | Ringkasan statistik |
| `GET` | `/api/reports/export-xlsx` | ✅ Ada | Export Excel |
| `GET` | `/api/reports/export-pdf` | ✅ Ada | Export PDF (server-side) |
| `GET` | `/api/reports/export-csv` | ✅ Ada | Export CSV |
| `GET` | `/api/reports/export-json` | ✅ Ada | Export JSON |

### Lainnya

| Method | Endpoint | Status | Keterangan |
|---|---|---|---|
| `GET` | `/api/training-info` | ✅ Ada | Info model + dataset stats |
| `GET/POST` | `/api/dataset` | ✅ Ada | Manajemen dataset foto |

---

## 3. TABEL DATABASE (Konfirmasi)

Berdasarkan `data/full-setup.sql` dan `data/models.ts`:

| # | Tabel | ✅ Ada? | Catatan |
|---|---|---|---|
| 1 | `admin_users` | ✅ | `id, email, password_hash, created_at` |
| 2 | `analysis_logs` | ✅ | `id, user_name, user_email, user_phone, user_age, [6 scores], dominant_condition, recommended_product_ids, created_at` |
| 3 | `brands` | ✅ | `id, name, logo_url, created_at` |
| 4 | `ingredients` | ✅ | `id, name, effect, [6 w_*weights], created_at` |
| 5 | `product_categories` | ✅ | `id, name, description, created_at` |
| 6 | `product_ingredients` | ✅ | `product_id, ingredient_id` (junction table) |
| 7 | `products` | ✅ | `id, name, brand_id, category_id, description, image_url, [6 w_*weights], created_at` |
| 8 | `recommendations` | ✅ | `id, condition, title, description, tips, created_at` |
| 9 | `rules` | ✅ | `id, skin_type_id (→ recommendations), product_id, confidence_score, created_at` |

**Semua 9 tabel yang diminta sudah ada di schema.** ✅

> **Catatan penting:** `analysis_logs.user_name` saat ini selalu diisi `'Guest'` dan `user_age` selalu `0` karena belum ada form input nama/usia sebelum scan.

---

## 4. FITUR YANG SUDAH BERJALAN

### ✅ CNN Classification (6 Kelas)
- Model TF.js sudah menggunakan 6 label: `acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles`
- `cnnSkinClassifier.ts` → inference `classifySkin()` sudah return probabilitas 6 kelas
- `skinAnalyzer.ts` → flow: snapshot → face detect → crop → CNN → scores sudah lengkap
- Face detection confidence fix **sudah diterapkan**: fallback ke `0.7` jika keypoints ada, `0.5` jika tidak — confidence tidak akan pernah `undefined`

### ✅ Capture Flow (Snapshot-Based, Bukan Continuous)
- `CameraPanel.tsx` → kamera hanya menampilkan live preview
- Processing hanya terjadi saat tombol "Capture" ditekan (single frame)
- Mode upload gambar juga didukung

### ✅ Admin Authentication
- JWT session via `jose`, disimpan di httpOnly cookie
- Middleware di `middleware.ts` protect semua `/admin/*`
- `AdminLayout` server component cek session, redirect ke `/login` jika gagal
- `admin_users` table dengan bcrypt password hash

### ✅ Master Data CRUD (4 data master)
- **Brands** → `/admin/brands` ✅ CRUD lengkap
- **Ingredients** → `/admin/ingredients` ✅ CRUD lengkap + bobot 6 kondisi
- **Product Categories** → `/admin/categories` ✅ CRUD lengkap
- **Products** → `/admin/products` ✅ CRUD lengkap + relasi ke brand, category, ingredients

### ✅ Rules Management
- `/admin/rules` → CRUD aturan kondisi → produk dengan `confidence_score`
- Terhubung ke `recommendations` (via `skin_type_id`) dan `products`

### ✅ Sistem Rekomendasi (Weighted Dot Product)
- `save-from-scan` API menghitung skor produk via dot product 6 dimensi
- Return TOP-3 produk dengan skor tertinggi

### ✅ Export Data
- Export ke Excel (xlsx), PDF (print popup), CSV, JSON tersedia

### ✅ Halaman Produk Publik
- `/products` dengan filter berdasarkan kondisi kulit

---

## 5. YANG BELUM ADA / BERMASALAH

### ❌ KRITIS — Wajib Diimplementasi

#### 5.1 Form Input Nama & Usia Sebelum Analisis
- **Problem:** `analysis_logs` selalu menyimpan `user_name = 'Guest'` dan `user_age = 0` karena tidak ada form input
- **Lokasi perbaikan:** `src/app/page.tsx` dan `src/app/api/analysis/save-from-scan/route.ts`
- **Yang diperlukan:** Modal/form sebelum capture — field `nama` (required) dan `usia` (required, integer)
- **Dampak:** Laporan per pengguna dan segmentasi usia tidak bisa digunakan

#### 5.2 Laporan Lengkap (4 Jenis Laporan)
- **Ada saat ini:** `/admin/reports` hanya menampilkan tabel histori + export sederhana
- **Belum ada:**
  1. ❌ **Distribusi Kondisi Kulit** — chart pie/bar dari `dominant_condition` di `analysis_logs`
  2. ❌ **Laporan Rekomendasi Produk** — produk paling sering direkomendasikan (dari `recommended_product_ids`)
  3. ❌ **Tren Kondisi Kulit** — chart time-series `analysis_logs` digroup per tanggal/periode
  4. ✅ **Histori Analisis** — sudah ada (tabel dengan filter)
- **Chart library:** Tidak ada (recharts / chart.js belum diinstall)

#### 5.3 Segmentasi Usia di Laporan
- **Problem:** `user_age` selalu 0 (lihat poin 5.1)
- **Yang diperlukan:** Grouping `<20, 20-35, 36-50, >50` di laporan distribusi

#### 5.4 Navbar Publik Menampilkan Link Admin
- **Problem:** Di `src/app/page.tsx` baris 85-95, navbar publik memiliki link langsung ke `/admin/products`
- **Prompt requirement:** "Navbar: only 'Live Scan' and 'Products' — no admin links in public navbar"
- **Fix:** Ganti link Products ke `/products` bukan `/admin/products`

#### 5.5 Privacy & Consent Popup
- **Problem:** Kode menggunakan `SweetAlert2` tapi popup consent belum terlihat di flow kamera
- **Prompt requirement:** "Privacy & Data Usage popup before camera access (already exists, keep it)"
- **Perlu dikonfirmasi:** Apakah sudah berjalan atau hanya placeholder

### ⚠️ PERLU DIPERHATIKAN

#### 5.6 Duplikasi Halaman Dashboard
- `/admin` (page.tsx) = dashboard baru dengan KPI cards + recent logs ✅
- `/admin/dashboard` (dashboard/page.tsx) = dashboard lama dengan tab system ⚠️ kemungkinan sudah tidak dipakai

#### 5.7 Sidebar Navigasi Tidak Lengkap
- Sidebar hanya menampilkan: Dashboard, Reports, Master Produk, Master Kondisi Kulit, Master Akun
- **Tidak muncul di sidebar:** Brands, Categories, Ingredients, Rules, Export
- Halaman-halaman tersebut ada tapi tidak bisa diakses dari navigasi

#### 5.8 `analysis_logs.user_phone` Tidak Dipakai
- Ada kolom `user_phone` di schema tapi prompt tidak mensyaratkan field ini
- Bisa dibiarkan null atau dihapus dari form

#### 5.9 Design Tidak Sesuai Requirement
- Prompt: "Left panel: full-width camera feed dengan bounding box overlay centered (not full-width box)"
- Saat ini: Tidak ada bounding box overlay di video preview
- Prompt: "Right panel (300px): 3 zones — result header, score bars, product recommendations (3 cards)"
- Saat ini: Layout sudah mirip tapi belum ada bounding box overlay di kamera

#### 5.10 `/admin/skin-types` Tidak Ada
- Di `src/app/admin/page.tsx` (tools list), ada link ke `/admin/skin-types` yang tidak ada
- Ada juga `SkinType` interface dan actions yang merupakan alias/legacy dari `recommendations`

---

## 6. RINGKASAN UNTUK IMPLEMENTASI

### Prioritas Tinggi (Wajib untuk Sidang TA)

```
1. [FORM] Form nama + usia → simpan ke analysis_logs dengan data real
2. [REPORT] Implementasi 4 laporan lengkap dengan chart (install recharts)
3. [REPORT] Segmentasi usia <20, 20-35, 36-50, >50
4. [NAV] Fix public navbar: Live Scan + Products (tanpa link admin)
5. [SIDEBAR] Tambahkan semua menu ke sidebar admin
```

### Prioritas Sedang (Bagus untuk Demo)

```
6. [UI] Bounding box overlay di camera preview
7. [UI] Privacy consent popup sebelum camera access
8. [CLEANUP] Hapus/arsipkan /admin/dashboard (duplikat)
9. [CLEANUP] Fix link /admin/skin-types yang broken
```

### Tidak Perlu Diubah (Sudah Oke)

```
✅ CNN 6-class classification → sudah benar
✅ Face detection confidence fix → sudah diterapkan
✅ Snapshot-based capture (bukan continuous) → sudah benar
✅ Admin auth + middleware protection → sudah benar
✅ CRUD 4 master data → sudah berfungsi
✅ Rules management → sudah berfungsi
✅ Database schema (9 tabel) → sudah lengkap
✅ Weighted recommendation scoring → sudah benar
✅ Export Excel/PDF → sudah ada (di laporan)
```

---

## 7. USE CASE DIAGRAM

### Aktor
- **Karyawan** (public user) — tidak perlu login
- **Administrator** — harus login

### Use Cases per Aktor

```
KARYAWAN
├── UC01 - Membuka aplikasi Live Scan
│   └── «include» UC02 - Melihat Privacy & Consent Popup
├── UC03 - Mengisi form identitas (nama + usia)  ← BELUM ADA, perlu dibuat
├── UC04 - Mengaktifkan kamera
├── UC05 - Melakukan capture wajah
│   ├── «include» UC06 - Deteksi wajah (MediaPipe)
│   ├── «include» UC07 - Klasifikasi kondisi kulit (CNN)
│   └── «include» UC08 - Melihat hasil analisis (6 skor + kondisi dominan)
├── UC09 - Melihat rekomendasi produk
│   └── «include» UC10 - Sistem simpan log analisis (otomatis)
├── UC11 - Upload gambar (sebagai alternatif kamera)
│   └── «extend» UC04
└── UC12 - Melihat halaman produk publik
    └── UC13 - Filter produk berdasarkan kondisi kulit

ADMINISTRATOR
├── UC14 - Login ke dashboard admin
├── UC15 - Logout
│
├── [MASTER DATA]
│   ├── UC16 - CRUD Produk
│   │   └── «include» UC17 - Relasi ke brand, kategori, dan bahan aktif
│   ├── UC18 - CRUD Brand
│   ├── UC19 - CRUD Kategori Produk
│   └── UC20 - CRUD Bahan Aktif (Ingredients)
│       └── «include» UC21 - Set bobot per kondisi kulit (6 dimensi)
│
├── [RULES]
│   └── UC22 - CRUD Aturan (Kondisi Kulit → Produk + confidence score)
│
├── [RECOMMENDATIONS]
│   └── UC23 - CRUD Teks Rekomendasi per Kondisi Kulit
│
├── [REPORTS]  ← 3 dari 4 BELUM ADA
│   ├── UC24 - Melihat Histori Analisis (dengan filter tanggal + kondisi) ✅
│   ├── UC25 - Melihat Distribusi Kondisi Kulit (chart) ❌
│   ├── UC26 - Melihat Laporan Rekomendasi Produk (chart) ❌
│   ├── UC27 - Melihat Tren Kondisi Kulit per Periode (chart) ❌
│   ├── UC28 - Melihat Segmentasi Usia ❌
│   └── UC29 - Export Laporan (Excel / PDF) ✅
│       └── «extend» UC24
│
└── [AKUN]
    └── UC30 - CRUD Akun Admin
```

---

## 8. ERD — ENTITY RELATIONSHIP DIAGRAM

```
┌─────────────────┐        ┌───────────────────────┐
│   admin_users   │        │     analysis_logs      │
│─────────────────│        │───────────────────────│
│ id (PK)         │        │ id (PK)               │
│ email (UNIQUE)  │        │ user_name             │
│ password_hash   │        │ user_email            │
│ created_at      │        │ user_phone            │
└─────────────────┘        │ user_age              │
                           │ acne_score            │
                           │ blackheads_score      │
                           │ clear_skin_score      │
                           │ dark_spots_score      │
                           │ puffy_eyes_score      │
                           │ wrinkles_score        │
                           │ dominant_condition    │
                           │ recommended_product_ids│
                           │ created_at            │
                           └───────────────────────┘

┌──────────┐    1     N   ┌─────────────────────────────┐
│  brands  │──────────────│         products             │
│──────────│              │─────────────────────────────│
│ id (PK)  │              │ id (PK)                     │
│ name     │              │ name                        │
│ logo_url │              │ brand_id (FK → brands)      │
│created_at│              │ category_id (FK → pcat)     │
└──────────┘              │ description                 │
                          │ image_url                   │
┌──────────────────┐  N   │ w_acne (REAL)               │
│product_categories│──────│ w_blackheads (REAL)         │
│──────────────────│      │ w_clear_skin (REAL)         │
│ id (PK)          │      │ w_dark_spots (REAL)         │
│ name             │      │ w_puffy_eyes (REAL)         │
│ description      │      │ w_wrinkles (REAL)           │
│ created_at       │      │ created_at                  │
└──────────────────┘      └──────────────┬──────────────┘
                                         │ N
                           ┌─────────────▼──────────────┐
                           │    product_ingredients      │
                           │────────────────────────────│
                           │ product_id (FK → products) │◄──┐
                           │ ingredient_id (FK → ingred)│   │
                           │ PRIMARY KEY (product_id,   │   │
                           │              ingredient_id)│   │
                           └────────────────────────────┘   │
                                         │ N                │
                           ┌─────────────▼──────────────┐   │
                           │        ingredients          │───┘
                           │────────────────────────────│
                           │ id (PK)                    │
                           │ name (UNIQUE)              │
                           │ effect                     │
                           │ w_acne (REAL)              │
                           │ w_blackheads (REAL)        │
                           │ w_clear_skin (REAL)        │
                           │ w_dark_spots (REAL)        │
                           │ w_puffy_eyes (REAL)        │
                           │ w_wrinkles (REAL)          │
                           │ created_at                 │
                           └────────────────────────────┘

┌───────────────────┐       ┌────────────────────────────┐
│  recommendations  │   1   │           rules            │
│───────────────────│───────│────────────────────────────│
│ id (PK)           │  N    │ id (PK)                    │
│ condition (UNIQUE)│       │ skin_type_id (FK → recom)  │
│ title             │       │ product_id (FK → products) │
│ description       │       │ confidence_score (REAL)    │
│ tips (JSON array) │       │ created_at                 │
│ created_at        │       └────────────────────────────┘
└───────────────────┘
```

### Relasi Ringkas

| Relasi | Jenis | Keterangan |
|---|---|---|
| `products` → `brands` | Many-to-One | Setiap produk punya satu brand (nullable) |
| `products` → `product_categories` | Many-to-One | Setiap produk punya satu kategori (nullable) |
| `products` ↔ `ingredients` | Many-to-Many | Via junction table `product_ingredients` |
| `rules` → `recommendations` | Many-to-One | Setiap rule terhubung ke satu kondisi kulit |
| `rules` → `products` | Many-to-One | Setiap rule merekomendasikan satu produk |
| `analysis_logs` | Standalone | Tidak ada FK, `recommended_product_ids` disimpan sebagai CSV string |
| `admin_users` | Standalone | Tidak ada relasi ke tabel lain |

---

## 9. IMPLEMENTASI YANG DIREKOMENDASIKAN (Urutan Pengerjaan)

```
Sprint 1 — Core Fix (½ hari)
├── Fix navbar publik: ganti /admin/products → /products
├── Tambahkan semua item ke sidebar admin
└── Fix link /admin/skin-types yang broken

Sprint 2 — Form Identitas (1 hari)
├── Buat modal form input nama + usia SEBELUM capture
├── Update state di page.tsx untuk menyimpan {nama, usia}
└── Update POST /api/analysis/save-from-scan untuk menerima {nama, usia}

Sprint 3 — Laporan & Chart (2 hari)
├── Install recharts: npm install recharts
├── Rombak /admin/reports menjadi 4 tab laporan:
│   ├── Tab 1: Histori Analisis (sudah ada, pindahkan)
│   ├── Tab 2: Distribusi Kondisi (PieChart dari dominant_condition)
│   ├── Tab 3: Rekomendasi Produk (BarChart dari recommended_product_ids)
│   └── Tab 4: Tren per Periode (LineChart dari created_at group by date)
└── Tambah segmentasi usia di laporan distribusi

Sprint 4 — UI Enhancement (½ hari)
├── Tambahkan bounding box overlay di CameraPanel
└── Pastikan privacy popup berjalan sebelum camera access
```
