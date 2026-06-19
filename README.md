# 🔬 SkinLab — Face Recognition Skincare Recommendation App

> **Tugas Akhir (TA)** — Aplikasi web berbasis AI yang mendeteksi kondisi kulit wajah secara real-time menggunakan kamera, kemudian memberikan rekomendasi produk skincare yang dipersonalisasi.

---

## 📌 Deskripsi Proyek

**SkinLab** adalah sistem rekomendasi produk skincare berbasis pengenalan wajah (face recognition) yang berjalan sepenuhnya di browser. Aplikasi ini menggunakan model CNN (Convolutional Neural Network) yang di-export ke TensorFlow.js untuk mengklasifikasikan kondisi kulit secara *client-side*, tanpa perlu mengirim foto ke server.

### Kondisi Kulit yang Dideteksi

| Label | Deskripsi |
|---|---|
| `acne` | Jerawat / bekas jerawat |
| `blackheads` | Komedo |
| `clear_skin` | Kulit bersih / sehat |
| `dark_spots` | Flek hitam / hiperpigmentasi |
| `puffy_eyes` | Mata sembab / lingkar hitam |
| `wrinkles` | Kerutan / tanda penuaan |

---

## 🚀 Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, Tailwind CSS v4 |
| **AI / ML (Client)** | TensorFlow.js, MediaPipe Face Detection, `@tensorflow-models/face-landmarks-detection` |
| **Model Training** | Python (TensorFlow/Keras), Google Colab |
| **Backend / API** | Next.js API Routes (Edge + Node.js Runtime) |
| **Database** | PostgreSQL via Supabase / pg direct |
| **Auth** | JWT (jose) + bcrypt, session via cookie |
| **Export** | PDFKit (PDF), xlsx (Excel), JSON/CSV |
| **Deploy** | Vercel |

---

## 🗂️ Struktur Folder

```
face-recognition-app/
├── src/
│   ├── app/                        # Next.js App Router pages & API routes
│   │   ├── page.tsx                # Halaman utama — kamera + analisis
│   │   ├── campaign/               # Landing page skin types
│   │   ├── products/               # Halaman produk publik
│   │   ├── recommendations/        # Halaman rekomendasi publik
│   │   ├── login/                  # Halaman login admin
│   │   ├── admin/                  # Dashboard admin (protected)
│   │   │   ├── dashboard/          # Overview statistik
│   │   │   ├── products/           # CRUD produk
│   │   │   ├── brands/             # CRUD brand
│   │   │   ├── categories/         # CRUD kategori
│   │   │   ├── ingredients/        # CRUD bahan aktif
│   │   │   ├── recommendations/    # CRUD teks rekomendasi
│   │   │   ├── rules/              # CRUD aturan rekomendasi
│   │   │   ├── reports/            # Laporan analisis
│   │   │   ├── export/             # Export data
│   │   │   └── accounts/           # Manajemen akun admin
│   │   └── api/                    # REST API endpoints
│   │       ├── analysis/           # Simpan hasil analisis
│   │       ├── analysis-logs/      # Log histori analisis
│   │       ├── products/           # API produk
│   │       ├── reports/            # Export: PDF, Excel, CSV, JSON
│   │       ├── training-info/      # Info dataset training
│   │       ├── login/ & logout/    # Auth endpoints
│   │       └── auth/session/       # Cek sesi aktif
│   ├── components/                 # React components
│   │   ├── CameraPanel.tsx         # Komponen kamera + capture
│   │   ├── ResultPanel.tsx         # Panel hasil analisis kulit
│   │   ├── RecommendationCard.tsx  # Kartu produk rekomendasi
│   │   ├── AppShell.tsx            # Layout utama
│   │   ├── AdminSidebar.tsx        # Sidebar navigasi admin
│   │   ├── TopBar.tsx              # Top navigation bar
│   │   ├── ModelLoader.tsx         # Loading state model AI
│   │   └── TrainingInfoCard.tsx    # Info model CNN
│   └── lib/                        # Core logic & utilities
│       ├── faceDetection.ts        # MediaPipe face detection wrapper
│       ├── skinAnalyzer.ts         # Orkestrasi: capture → detect → classify
│       ├── cnnSkinClassifier.ts    # TF.js model inference
│       ├── skinWeights.ts          # Tipe data & label CNN
│       ├── supabaseClient.ts       # Supabase JS client
│       ├── db-pg-supabase-adapter.ts # DB adapter (Supabase / pg)
│       └── simple-auth.ts          # JWT session helper
├── public/
│   ├── models/skin-classifier/
│   │   ├── tfjs/                   # Model TF.js (model.json + weights)
│   │   ├── saved_model/            # TensorFlow SavedModel
│   │   ├── model.keras             # Keras model file
│   │   ├── model.tflite            # TFLite model (mobile)
│   │   └── labels.json             # Label mapping CNN
│   └── dataset/unlabeled/          # Foto scan yang belum dilabeli
├── data/
│   ├── training/                   # Dataset gambar per kondisi kulit
│   │   └── wrinkles/               # (+ acne/, blackheads/, dst.)
│   ├── models.ts                   # Type definitions database
│   ├── init.ts                     # Inisialisasi database
│   ├── inject-data.ts              # Seeding data produk & bahan
│   ├── check-seed.ts               # Verifikasi seed
│   ├── full-setup.sql              # SQL lengkap: migrasi + seed
│   └── supabase-migration.sql      # SQL khusus Supabase
├── scripts/
│   ├── train_model.py              # Training CNN (Python/Keras)
│   ├── train_colab.ipynb           # Notebook Google Colab
│   ├── train-skin-model.ts         # Training helper (TypeScript)
│   ├── train-fast.ts               # Training cepat (TypeScript)
│   ├── create-admin.ts             # Script buat akun admin
│   ├── setup-deploy-db.ts          # Setup DB untuk deploy
│   └── setup-https.js              # Local HTTPS setup
├── diagrams/                       # Diagram UML (.puml)
│   ├── use-case-diagram.puml
│   ├── activity-diagram.puml
│   ├── sequence-diagram.puml
│   └── class-diagram.puml
├── middleware.ts                   # Auth guard untuk /admin routes
├── env.example                     # Contoh environment variables
├── vercel.json                     # Konfigurasi deployment Vercel
└── package.json
```

---

## ⚙️ Cara Menjalankan Lokal

### 1. Clone & Install Dependencies

```bash
cd "D:\TA Bani\app\face-recognition-app"
npm install
```

### 2. Setup Environment Variables

Salin `env.example` ke `.env.local` dan isi sesuai konfigurasi:

```bash
cp env.example .env.local
```

```env
# Supabase (development)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database PostgreSQL (production / Vercel)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Session
SESSION_SECRET=your_secure_random_secret

# Admin seed (opsional)
ADMIN_EMAIL=admin@skinlab.com
ADMIN_PASSWORD=admin123
```

### 3. Inisialisasi Database

```bash
# Buat tabel + relasi
npm run init-db

# Isi data awal (produk, bahan aktif, brand, dll)
npm run inject-data

# Buat akun admin
npm run create-admin
```

Atau jalankan SQL manual di Supabase SQL Editor menggunakan `data/full-setup.sql`.

### 4. Jalankan Development Server

```bash
# HTTP (standar)
npm run dev

# HTTPS (diperlukan untuk akses kamera di browser non-localhost)
npm run setup:https   # sekali saja
npm run dev:https
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 🧠 Alur Kerja Sistem AI

```
Kamera/Foto → Snapshot Canvas
      ↓
MediaPipe Face Detection
      ↓
  Wajah Terdeteksi?
  ├── Tidak → Tampilkan pesan "No face detected"
  └── Ya → Crop region wajah
              ↓
        CNN Skin Classifier (TF.js)
        (model: /public/models/skin-classifier/tfjs/)
              ↓
        Probabilitas 6 kondisi kulit
              ↓
        Weighted Scoring per produk
              ↓
        TOP-N Rekomendasi Produk
              ↓
        Simpan ke analysis_logs (DB)
```

---

## 🏋️ Training Model CNN

### Menggunakan Python (Lokal)

```bash
# Install dependencies Python
pip install tensorflow tensorflowjs pillow

# Jalankan training
python scripts/train_model.py
```

### Menggunakan Google Colab

Buka `scripts/train_colab.ipynb` di Google Colab. Model akan di-export otomatis ke format TF.js.

**Konfigurasi Training:**
- Input size: `128 × 128 px`
- Epochs: 15
- Batch size: 32
- Learning rate: 0.001
- Validation split: 20%
- Output: `public/models/skin-classifier/tfjs/`

**Struktur dataset training:**

```
data/training/
├── acne/
├── blackheads/
├── clear_skin/
├── dark_spots/
├── puffy_eyes/
└── wrinkles/
```

---

## 🛡️ Admin Dashboard

Akses di `/admin` (memerlukan login). Fitur-fitur:

| Menu | Fungsi |
|---|---|
| **Dashboard** | Overview statistik, log analisis terbaru |
| **Products** | CRUD produk skincare + bobot kondisi kulit |
| **Brands** | CRUD brand produk |
| **Categories** | CRUD kategori produk |
| **Ingredients** | CRUD bahan aktif + bobot per kondisi |
| **Recommendations** | Teks rekomendasi per kondisi kulit |
| **Rules** | Aturan pemetaan kondisi → produk |
| **Reports** | Laporan analisis + distribusi kondisi |
| **Export** | Export ke Excel (.xlsx), PDF, CSV, JSON |
| **Accounts** | Manajemen akun admin |

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/analysis/save-from-scan` | Simpan hasil scan & ambil rekomendasi |
| `GET` | `/api/analysis` | Ambil log analisis |
| `GET` | `/api/analysis-logs` | Log analisis (admin) |
| `GET` | `/api/products` | Daftar produk |
| `GET/POST/PUT/DELETE` | `/api/products/[id]` | CRUD produk |
| `GET` | `/api/reports/summary` | Ringkasan laporan |
| `GET` | `/api/reports/export-xlsx` | Export Excel |
| `GET` | `/api/reports/export-pdf` | Export PDF |
| `GET` | `/api/reports/export-csv` | Export CSV |
| `GET` | `/api/reports/export-json` | Export JSON |
| `GET` | `/api/training-info` | Info dataset & model |
| `POST` | `/api/login` | Login admin |
| `POST` | `/api/logout` | Logout |
| `GET` | `/api/auth/session` | Cek sesi aktif |

---

## 🗄️ Skema Database

```
brands              → brand produk
product_categories  → kategori produk
ingredients         → bahan aktif skincare (dengan bobot per kondisi)
products            → produk skincare (dengan bobot per kondisi)
product_ingredients → relasi produk ↔ bahan aktif (many-to-many)
recommendations     → teks rekomendasi per kondisi kulit
rules               → aturan kondisi → produk (confidence score)
analysis_logs       → histori scan & rekomendasi pengguna
users               → akun admin
```

---

## 📊 Diagram UML

Semua diagram sistem tersimpan di folder `diagrams/` dalam format PlantUML (`.puml`):

- `use-case-diagram.puml` — Aktor & use case sistem
- `activity-diagram.puml` — Alur aktivitas pengguna
- `sequence-diagram.puml` — Urutan interaksi antar komponen
- `class-diagram.puml` — Struktur kelas & relasi

Render menggunakan [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/) atau ekstensi VS Code.

---

## 🚢 Deployment (Vercel)

```bash
npm run build
```

**Environment variables yang wajib di-set di Vercel:**
- `DATABASE_URL`
- `SESSION_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL` *(jika pakai Supabase)*
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` *(jika pakai Supabase)*

---

## 📝 Lisensi

Proyek ini dibuat untuk keperluan **Tugas Akhir (Skripsi)**. Seluruh hak cipta milik penulis.
