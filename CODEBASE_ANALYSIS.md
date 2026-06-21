# 🔍 Codebase Analysis Report
## Face Analytic — Skin Condition Classification App (TA)

> Analisis menyeluruh sebelum implementasi berdasarkan prompt requirement.  
> Stack aktual: **Next.js 15, React 19, TailwindCSS, PostgreSQL (Supabase/pg), TensorFlow.js, MediaPipe**  
> **Terakhir diverifikasi vs source code:** review BAB IV (login, arsitektur analisa, Server Actions admin, export)

---

## 1. PAGES / ROUTES YANG ADA SEKARANG

### Public Routes (tanpa login)

| Route | File | Status | Keterangan |
|---|---|---|---|
| `/` | `src/app/page.tsx` | ✅ Ada & berfungsi | Halaman utama Live Scan |
| `/products` | `src/app/products/page.tsx` | ✅ Ada & berfungsi | Halaman produk publik dengan filter kondisi |
| `/recommendations` | `src/app/recommendations/page.tsx` | ✅ Ada | Rekomendasi berdasarkan `?condition=` query param |
| `/campaign` | `src/app/campaign/page.tsx` | ✅ Ada | Landing page jenis kulit (statis) |
| `/login` | `src/app/login/page.tsx` | ✅ Ada & berfungsi | Halaman login admin — field pertama **Email** (label), placeholder `admin@skinlab.com`, body POST `{ email, password }` |

### Admin Routes (protected — redirect ke `/login` jika belum login)

| Route | File | Status | Keterangan |
|---|---|---|---|
| `/admin` | `src/app/admin/page.tsx` | ✅ Ada | Dashboard overview + KPI cards + quick links |
| `/admin/dashboard` | — | ✅ Redirect | Permanent redirect ke `/admin` via `next.config.ts` |
| `/admin/products` | `src/app/admin/products/page.tsx` | ✅ Ada & berfungsi | CRUD produk via **Server Action** (`src/app/admin/actions.ts`) |
| `/admin/brands` | `src/app/admin/brands/page.tsx` | ✅ Ada & berfungsi | CRUD brand via **Server Action** |
| `/admin/categories` | `src/app/admin/categories/page.tsx` | ✅ Ada & berfungsi | CRUD kategori via **Server Action** |
| `/admin/ingredients` | `src/app/admin/ingredients/page.tsx` | ✅ Ada & berfungsi | CRUD bahan aktif + bobot CNN via **Server Action** |
| `/admin/recommendations` | `src/app/admin/recommendations/page.tsx` | ✅ Ada & berfungsi | CRUD teks rekomendasi per kondisi |
| `/admin/rules` | `src/app/admin/rules/page.tsx` | ✅ Ada & berfungsi | CRUD aturan kondisi → produk |
| `/admin/reports` | `src/app/admin/reports/page.tsx` | ✅ Lengkap | 4 tab: Histori, Distribusi, Rekomendasi Produk, Tren (+ recharts) |
| `/admin/export` | `src/app/admin/export/page.tsx` | ✅ Ada | Export **CSV + JSON** saja (via `/api/reports/export-csv`, `/api/reports/export-json`) |
| `/admin/accounts` | `src/app/admin/accounts/page.tsx` | ✅ Ada & berfungsi | CRUD akun admin |

> **Catatan:** Sidebar admin (`AdminSidebar.tsx` via `layout.tsx`) menampilkan: **Dashboard, Laporan, Export Data**, grup **Master Data** (Produk, Brand, Kategori, Bahan Aktif), dan grup **Konfigurasi** (Rules, Rekomendasi, Akun Admin).

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
| `POST` | `/api/analysis/save-from-scan` | ✅ Berfungsi | **Dipakai halaman utama** — terima `scores` dari client, hitung rekomendasi, simpan log |
| `POST` | `/api/analysis` | ⚠️ Ada, tidak dipakai UI utama | Alternatif/legacy — terima skor mentah + user fields; halaman `/` memakai `save-from-scan` |
| `GET` | `/api/analysis-logs` | ✅ Ada | Logs dengan filter date/condition |

> **Arsitektur analisa (2 lapisan terpisah):**
> - **Client-side (browser):** `CameraPanel` → `skinAnalyzer.ts` → `cnnSkinClassifier.ts` — face detection + inferensi CNN
> - **Server-side (API):** `page.tsx` kirim hasil ke `POST /api/analysis/save-from-scan` — rekomendasi produk + penyimpanan log

### Products (REST — halaman publik, bukan admin CRUD)

| Method | Endpoint | Status | Keterangan |
|---|---|---|---|
| `GET` | `/api/products` | ✅ Berfungsi | Dipakai `/products`, `RecommendationCard`, `/recommendations` |
| `POST` | `/api/products` | ✅ Ada | Buat produk (REST) — **admin CRUD tidak memakai ini** |
| `GET/PUT/DELETE` | `/api/products/[id]` | ✅ Ada | Operasi per produk (REST) |

### Admin CRUD (Server Actions — `'use server'`)

| Modul | File actions | Dipanggil dari |
|---|---|---|
| Brand, Category, Ingredients, Product, Recommendations, Analysis logs | `src/app/admin/actions.ts` | Halaman `/admin/brands`, `/categories`, `/ingredients`, `/products`, dll. |
| Rules | `src/app/admin/rules/actions.ts` | `/admin/rules` |
| Admin accounts | `src/app/admin/actions.ts` | `/admin/accounts` |

### Reports / Export

| Method | Endpoint | Status | Keterangan |
|---|---|---|---|
| `GET` | `/api/reports/charts` | ✅ Berfungsi | Data chart: distribusi, segmentasi usia, top produk, tren — dipakai `/admin/reports` |
| `GET` | `/api/reports/summary` | ✅ Ada | Ringkasan statistik (aggregat) |
| `GET` | `/api/reports/export-xlsx` | ⚠️ Ada, **tidak di-wire UI** | Server-side XLSX (sheet Analyses + Summary) |
| `GET` | `/api/reports/export-pdf` | ⚠️ Ada, **tidak di-wire UI** | Server-side PDF (distribusi kondisi + recent analyses) |
| `GET` | `/api/reports/export-csv` | ✅ Dipakai UI | Dipanggil dari `/admin/export` |
| `GET` | `/api/reports/export-json` | ✅ Dipakai UI | Dipanggil dari `/admin/export` |

> **Tidak ada** endpoint/halaman export terpisah khusus "Skin Condition" saja. Export yang aktif di UI:
> - Tab **Histori Analisis** (`/admin/reports`) — Excel + PDF **client-side** (kolom Kondisi + Rekomendasi dalam satu file)
> - Halaman **Export Data** (`/admin/export`) — CSV + JSON
> - Tab Distribusi, Rekomendasi Produk, Tren — **tanpa** tombol export

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

> **Catatan:** `analysis_logs` menyimpan `user_name` dan `user_age` dari form identitas sebelum scan. Kolom `user_phone` sengaja dibiarkan `null` (tidak diminta requirement).

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

### ✅ Master Data CRUD (4 data master) — via Server Actions
Semua CRUD admin (Brand, Category, Ingredients, Product) memakai **Next.js Server Action** di `src/app/admin/actions.ts` (`'use server'`), **bukan** REST API route.

| Modul | Halaman | Actions (contoh) |
|---|---|---|
| Brands | `/admin/brands` | `getBrandsAction`, `createBrandAction`, `updateBrandAction`, `deleteBrandAction` |
| Categories | `/admin/categories` | `getCategoriesAction`, `createCategoryAction`, … |
| Ingredients | `/admin/ingredients` | `getIngredientsAction`, `createIngredientAction`, … + bobot 6 kondisi |
| Products | `/admin/products` | `getProductsAction`, `createProductAction`, `updateProductAction`, `deleteProductAction`, `getProductIngredientsAction` |

Route REST `/api/products` hanya dipakai halaman **publik** (`/products`, `/recommendations`).

### ✅ Rules Management
- `/admin/rules` → CRUD aturan kondisi → produk dengan `confidence_score`
- Terhubung ke `recommendations` (via `skin_type_id`) dan `products`

### ✅ Sistem Rekomendasi (Weighted Dot Product)
- `save-from-scan` API menghitung skor produk via dot product 6 dimensi
- Return TOP-3 produk dengan skor tertinggi

### ✅ Export Data
- **Histori Analisis** (`/admin/reports`, tab pertama): export Excel (client-side `xlsx`) + PDF (print popup browser) — satu file berisi kondisi dominan **dan** rekomendasi produk
- **Export Data** (`/admin/export`): CSV + JSON via API route
- Route server `/api/reports/export-xlsx` dan `/api/reports/export-pdf` **ada di kode** tetapi tidak terhubung ke tombol UI manapun
- **Tidak ada** laporan export terpisah khusus "Skin Condition" vs distribusi/rekomendasi

### ✅ Halaman Produk Publik
- `/products` dengan filter berdasarkan kondisi kulit

### ✅ Form Identitas Pengguna (Nama & Usia)
- Modal `UserInfoModal` di `src/app/page.tsx` — wajib sebelum akses kamera
- Data disimpan ke `sessionStorage` dan dikirim ke `POST /api/analysis/save-from-scan`
- API memvalidasi `nama` dan `usia` (1–100)

### ✅ Laporan Admin Lengkap (4 Tab + Chart)
- `/admin/reports` — Histori, Distribusi Kondisi, Rekomendasi Produk, Tren Kondisi
- Chart library: **recharts** (`PieChart`, `BarChart`, `LineChart`)
- Segmentasi usia: `<20`, `20-35`, `36-50`, `>50` via `GET /api/reports/charts`

### ✅ Privacy Consent & Bounding Box
- Popup SweetAlert2 **sebelum** akses kamera (`CameraPanel.tsx`)
- Live face bounding box overlay pada preview kamera & upload gambar

### ✅ Navigasi Admin Lengkap
- Sidebar: Dashboard, Laporan, Export, Master Data (4 item), Konfigurasi (Rules, Rekomendasi, Akun)
- Dashboard quick-links ke semua modul (termasuk `/admin/recommendations`, bukan `/admin/skin-types`)

---

## 5. STATUS IMPLEMENTASI (Diperbarui)

### ✅ Selesai — Poin 5.1 s.d. 5.10

#### 5.1 Form Input Nama & Usia Sebelum Analisis ✅
- `UserInfoModal` di `src/app/page.tsx` — field `nama` + `usia` wajib
- `CameraPanel` hanya dimuat setelah form disubmit
- `POST /api/analysis/save-from-scan` memvalidasi dan menyimpan data real

#### 5.2 Laporan Lengkap (4 Jenis Laporan) ✅
- Tab **Histori Analisis** — tabel + filter + export Excel/PDF (client-side, kondisi + rekomendasi dalam satu export)
- Tab **Distribusi Kondisi** — PieChart + ringkasan per kondisi
- Tab **Rekomendasi Produk** — BarChart top 10 produk
- Tab **Tren Kondisi** — LineChart per hari/minggu/bulan
- Data dari `GET /api/reports/charts`, library **recharts** terpasang

#### 5.3 Segmentasi Usia di Laporan ✅
- Chart stacked bar **Segmentasi Usia per Kondisi Kulit** di tab Distribusi
- Grouping: `<20`, `20-35`, `36-50`, `>50`, `Tidak diketahui`

#### 5.4 Navbar Publik ✅
- Navbar hanya **Live Scan** (`/`) dan **Produk** (`/products`) — tanpa link admin

#### 5.5 Privacy & Consent Popup ✅
- SweetAlert2 ditampilkan sebelum `getUserMedia` / load model
- Kamera tidak aktif sampai pengguna klik **"Saya Mengerti"**

#### 5.6 Duplikasi Halaman Dashboard ✅
- `/admin/dashboard` → permanent redirect ke `/admin` (`next.config.ts`)
- File `dashboard/page.tsx` dihapus

#### 5.7 Sidebar Navigasi ✅
- Semua menu dapat diakses: Export Data ditambahkan ke sidebar top-level
- Master Data + Konfigurasi sudah lengkap di `admin/layout.tsx`

#### 5.8 `analysis_logs.user_phone` ✅
- Kolom tetap ada di schema, selalu disimpan `null`
- Requirement hanya mensyaratkan nama & usia — tidak perlu form telepon

#### 5.9 Design Bounding Box Overlay ✅
- Viewfinder panduan (corner markers) saat wajah belum terdeteksi
- **Live bounding box** biru mengikuti wajah terdeteksi di preview kamera
- Overlay juga pada mode upload gambar
- Panel kanan ~320px: hasil analisis + score bars + 3 rekomendasi produk

#### 5.10 Link `/admin/skin-types` ✅
- Tidak ada route `/admin/skin-types` — diganti ke `/admin/recommendations` (Kondisi Kulit)
- Dashboard quick-links diperbarui, tidak ada link broken

---

## 5 (ARSIP). CATATAN AWAL ANALISIS — Sudah Teratasi

_Poin di bawah ini adalah temuan awal sebelum implementasi; semua sudah diselesaikan di atas._

---

## 6. RINGKASAN IMPLEMENTASI

### ✅ Selesai (Siap Sidang TA)

```
✅ Form nama + usia → analysis_logs dengan data real
✅ 4 laporan lengkap dengan recharts + segmentasi usia
✅ Navbar publik: Live Scan + Products (tanpa link admin)
✅ Sidebar admin lengkap + Export Data
✅ Privacy consent sebelum kamera
✅ Live bounding box overlay di preview
✅ Redirect /admin/dashboard → /admin
✅ Link Kondisi Kulit → /admin/recommendations
```

### Tidak Perlu Diubah (Sudah Oke)

```
✅ CNN 6-class classification
✅ Face detection confidence fix
✅ Snapshot-based capture (bukan continuous)
✅ Admin auth + middleware protection
✅ CRUD master data via Server Actions (brands, categories, ingredients, products)
✅ Rules management (Server Action di rules/actions.ts)
✅ Database schema (9 tabel)
✅ Weighted recommendation scoring (client CNN → server save-from-scan)
✅ Export: Histori (Excel/PDF client-side) + Export page (CSV/JSON)
✅ user_phone dibiarkan null (by design)
```

---

## 7. USE CASE DIAGRAM

> **Catatan file:** `diagrams/use-case-diagram.puml` **tidak ada** di repo. Diagram di bawah disusun inline untuk referensi skripsi; cocokkan dengan teks BAB IV Anda.

### Aktor
- **Karyawan** (public user) — tidak perlu login
- **Administrator** — harus login

### Use Cases per Aktor

```
KARYAWAN
├── UC01 - Membuka aplikasi Live Scan
│   └── «include» UC02 - Melihat Privacy & Consent Popup
├── UC03 - Mengisi form identitas (nama + usia)  ✅
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
├── [REPORTS]
│   ├── UC24 - Melihat Histori Analisis (dengan filter tanggal + kondisi) ✅
│   ├── UC25 - Melihat Distribusi Kondisi Kulit (chart) ✅
│   ├── UC26 - Melihat Laporan Rekomendasi Produk (chart) ✅
│   ├── UC27 - Melihat Tren Kondisi Kulit per Periode (chart) ✅
│   ├── UC28 - Melihat Segmentasi Usia ✅
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

## 9. RIWAYAT SPRINT (Selesai)

```
Sprint 1 — Core Fix ✅
├── Navbar publik: /products (bukan /admin/products)
├── Sidebar admin lengkap + Export Data
└── Link Kondisi Kulit → /admin/recommendations

Sprint 2 — Form Identitas ✅
├── Modal nama + usia sebelum capture
├── sessionStorage + validasi API save-from-scan

Sprint 3 — Laporan & Chart ✅
├── recharts terpasang
├── 4 tab laporan di /admin/reports
└── Segmentasi usia di tab Distribusi

Sprint 4 — UI Enhancement ✅
├── Live bounding box overlay di CameraPanel
├── Privacy popup sebelum akses kamera
└── Redirect permanen /admin/dashboard → /admin
```

---

## 10. VERIFIKASI SOURCE CODE (BAB IV — UML / Wireframe / Skripsi)

> Verifikasi langsung terhadap kode aktual (bukan dokumentasi). Diperbarui untuk review BAB IV.

### 10.1 Login Admin

| Item | Nilai di kode |
|---|---|
| File | `src/app/login/page.tsx` (tidak ada komponen `LoginForm` terpisah) |
| Label field pertama | **Email** (baris 58–59) |
| Placeholder | `admin@skinlab.com` (bukan "Email" atau "Username") |
| Field POST ke `/api/login` | **`email`** — `{ email, password }` (baris 22) |
| Backend | `src/app/api/login/route.ts` baris 9 — expect `email` |

### 10.2 Alur Analisa Wajah — Dua Lapisan Terpisah

Bukan dua nama untuk alur yang sama; ini **satu pipeline berurutan** dengan dua tanggung jawab berbeda:

```
[Browser] CameraPanel → skinAnalyzer.ts → cnnSkinClassifier.ts
         (face detect + CNN inferensi)
              ↓ scores, skinType
[Server]  POST /api/analysis/save-from-scan
         (rekomendasi produk + simpan analysis_logs)
              ↓
         page.tsx menampilkan recommendations
```

| Lapisan | File utama | Peran |
|---|---|---|
| Client | `src/lib/skinAnalyzer.ts` (134–160), `src/lib/cnnSkinClassifier.ts`, `src/components/CameraPanel.tsx` | Inferensi CNN di browser |
| Server | `src/app/api/analysis/save-from-scan/route.ts` | Dot-product rekomendasi + `createAnalysisLog()` |
| Orkestrasi UI | `src/app/page.tsx` (218–239) | Panggil API setelah capture |

Route alternatif `POST /api/analysis` (`src/app/api/analysis/route.ts`) ada tetapi **tidak** dipanggil halaman utama.

### 10.3 CRUD Admin — Brand, Category, Ingredients

**Server Action** (`'use server'`), file: `src/app/admin/actions.ts`

| Fitur | Halaman | Actions |
|---|---|---|
| Brand | `src/app/admin/brands/page.tsx` | `getBrandsAction`, `createBrandAction`, `updateBrandAction`, `deleteBrandAction` (≈ baris 136–178) |
| Product Category | `src/app/admin/categories/page.tsx` | `getCategoriesAction`, `createCategoryAction`, `updateCategoryAction`, `deleteCategoryAction` (≈ baris 184–226) |
| Ingredients | `src/app/admin/ingredients/page.tsx` | `getIngredientsAction`, `createIngredientAction`, `updateIngredientAction`, `deleteIngredientAction` (≈ baris 232–267) |

### 10.4 CRUD Admin — Product

**Server Action** (bukan API Route untuk admin):

| Item | Detail |
|---|---|
| Halaman | `src/app/admin/products/page.tsx` |
| Actions | `getProductsAction`, `createProductAction`, `updateProductAction`, `deleteProductAction`, `getProductIngredientsAction` di `src/app/admin/actions.ts` (≈ baris 326–388) |
| REST API | `src/app/api/products/route.ts`, `src/app/api/products/[id]/route.ts` — hanya halaman publik |

### 10.5 File PlantUML Use Case

**Tidak ditemukan** — tidak ada `diagrams/use-case-diagram.puml` maupun file `.puml` lain di repo. Gunakan Section 7 dokumen ini atau file skripsi terpisah.

### 10.6 Export Laporan Skin Condition

**Tidak ada** endpoint/halaman export khusus "Skin Condition" yang terpisah dari rekomendasi/distribusi.

| Lokasi | Format | Isi export |
|---|---|---|
| `src/app/admin/reports/page.tsx` — tab Histori (175–183) | XLSX + PDF client-side | Tanggal, Nama, Usia, **Kondisi**, **Rekomendasi** (gabungan) |
| `src/app/admin/export/page.tsx` | CSV, JSON | Log analisis via API |
| `src/app/api/reports/export-xlsx/route.ts` | XLSX server | Sheet Analyses (skor + kondisi + rekomendasi) + Summary — **tidak di-wire UI** |
| `src/app/api/reports/export-pdf/route.ts` | PDF server | Distribusi kondisi + recent analyses — **tidak di-wire UI** |
| Tab Distribusi / Rekomendasi Produk / Tren | — | Tanpa tombol export |
