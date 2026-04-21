# PRD / Spesifikasi Teknis — 4 Laporan Analitik Baru

> **Proyek:** Face Recognition Based Skincare Recommendation App  
> **Tujuan:** Menambahkan 4 jenis laporan analitik pada modul Admin → Reports  
> **Versi:** 1.0  
> **Tanggal:** 2026-04-22  
> **Catatan:** Keempat laporan ini dirancang agar **tidak bergantung pada `user_age`** (sering bernilai 0 pada data percobaan), melainkan sepenuhnya menggunakan kolom-kolom yang selalu terisi: `created_at`, 6 skor CNN (`acne_score`, `blackheads_score`, `clear_skin_score`, `dark_spots_score`, `puffy_eyes_score`, `wrinkles_score`), `dominant_condition`, dan `recommended_product_ids`.

---

## Daftar Isi

1. [Ikhtisar Implementasi](#1-ikhtisar-implementasi)
2. [Report 1: Temporal Trend Analysis](#2-report-1-temporal-trend-analysis)
3. [Report 2: Product-Condition Correlation](#3-report-2-product-condition-correlation)
4. [Report 3: Skin Condition Co-occurrence](#4-report-3-skin-condition-co-occurrence)
5. [Report 4: Model Confidence Distribution](#5-report-4-model-confidence-distribution)
6. [Struktur Endpoint API](#6-struktur-endpoint-api)
7. [Struktur UI Admin / Reports](#7-struktur-ui-admin--reports)
8. [Jadwal Implementasi](#8-jadwal-implementasi)

---

## 1. Ikhtisar Implementasi

### Alasan Keempat Report Dipilih

| No | Nama Report | Nilai Akademis | Data yang Digunakan |
|----|-------------|----------------|---------------------|
| 1 | Temporal Trend Analysis | Menunjukkan pola penggunaan sistem secara longitudinal (time-series); dasar evaluasi *real-world deployment* | `created_at`, `dominant_condition` |
| 2 | Product-Condition Correlation | Memvalidasi apakah sistem rekomendasi *rule-based* benar-benar memetakan produk ke kondisi kulit yang relevan | `dominant_condition`, `recommended_product_ids` |
| 3 | Skin Condition Co-occurrence | Memvalidasi apakah CNN "memahami" hubungan dermatologis antar-kondisi (misal: acne & blackheads sering muncul bersamaan) | 6 skor CNN |
| 4 | Model Confidence Distribution | Mengevaluasi performa dan kepercayaan model CNN per kelas; identifikasi kelas yang sering ambigu | 6 skor CNN |

### Batasan Lingkup (Scope)

- **Backend:** Menambahkan 4 endpoint API baru di `src/app/api/reports/`.
- **Frontend:** Menambahkan 4 tab baru di halaman `/admin/reports` (`src/app/admin/reports/page.tsx`).
- **Export:** Setiap report dilengkapi tombol **Export to Excel** (xlsx) dan **Export to PDF** (html-print atau pdfkit).
- **Filter:** Semua report mendukung filter rentang tanggal (`startDate`, `endDate`) via query parameter.

---

## 2. Report 1: Temporal Trend Analysis

### 2.1 Tujuan
Menampilkan tren jumlah analisis wajah dan distribusi kondisi kulit dominan dari waktu ke waktu (harian, mingguan, atau bulanan).

### 2.2 Data Source
- Tabel: `analysis_logs`
- Kolom: `created_at`, `dominant_condition`, 6 skor CNN

### 2.3 Metode Perhitungan

**A. Time-Series Aggregation**

```
GROUP BY: DATE_TRUNC('day', created_at)   -- atau 'week', 'month'
METRIK PER GRUP:
  - count(*)                          → total_analyses
  - count(dominant_condition = 'acne') → acne_count
  - count(dominant_condition = 'blackheads') → blackheads_count
  - ... (untuk 6 kondisi)
  - AVG(acne_score)                   → rata-rata skor acne pada tanggal tersebut
  - AVG(wrinkles_score)               → rata-rata skor wrinkles pada tanggal tersebut
  - ... (untuk 6 skor)
```

**B. Moving Average (Opsional / Bonus)**
- 7-day moving average untuk smoothing grafik jumlah analisis.

**C. Peak Usage**
- Identifikasi hari dengan jumlah analisis tertinggi.

### 2.4 Endpoint API

```
GET /api/reports/trends?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&groupBy=day|week|month
```

**Response Schema (JSON):**

```json
{
  "groupBy": "day",
  "totalRecords": 152,
  "trends": [
    {
      "period": "2026-04-01",
      "totalAnalyses": 12,
      "conditionCounts": {
        "acne": 5,
        "wrinkles": 3,
        "clear_skin": 2,
        "dark_spots": 1,
        "blackheads": 1,
        "puffy_eyes": 0
      },
      "averageScores": {
        "acne": 0.72,
        "blackheads": 0.21,
        "clear_skin": 0.15,
        "dark_spots": 0.33,
        "puffy_eyes": 0.08,
        "wrinkles": 0.41
      }
    }
  ],
  "peakDay": { "period": "2026-04-05", "totalAnalyses": 18 },
  "summary": {
    "mostFrequentCondition": "acne",
    "growthRate": "+23%"  -- vs periode sebelumnya (jika comparable)
  }
}
```

### 2.5 Tampilan UI (Deskripsi)

- **Line Chart / Sparkline:** Jumlah analisis per hari (sumbu X = tanggal, sumbu Y = count).
- **Stacked Area Chart (atau tabel):** Proporsi 6 kondisi per periode waktu.
- **Summary Cards:** Total analisis di rentang filter; kondisi terbanyak; hari puncak.

---

## 3. Report 2: Product-Condition Correlation

### 3.1 Tujuan
Memvalidasi bahwa sistem rekomendasi *rule-based* memang merekomendasikan produk yang relevan dengan kondisi kulit terdeteksi. Contoh: produk anti-wrinkle seharusnya dominan direkomendasikan saat `dominant_condition = 'wrinkles'`.

### 3.2 Data Source
- Tabel: `analysis_logs` + `products`
- Kolom: `dominant_condition`, `recommended_product_ids` (CSV), `products.id`, `products.name`, `products.brand_id`

### 3.3 Metode Perhitungan

**A. Cross-Tabulation (Dominant Condition × Recommended Product)**

```
UNTUK setiap log:
  Parse recommended_product_ids → array product_id
  UNTUK setiap product_id dalam array:
    Tambahkan count ke matrix[dominant_condition][product_id] += 1
```

**B. Product Coverage**
- Hitung berapa persen dari total produk di database yang pernah direkomendasikan.
- Identifikasi produk "over-recommended" (Gini-like concentration index, opsional).

**C. Average Skin Score Profile per Product**

```
UNTUK setiap product_id:
  Ambil SEMUA log yang merekomendasikan product_id tersebut
  Hitung rata-rata 6 skor CNN dari log-log tersebut
  Simpan sebagai "skin profile" produk tersebut
```

Ini menunjukkan: *"User yang direkomendasikan Produk X rata-rata punya acne_score 0.81, wrinkles_score 0.12"*.

### 3.4 Endpoint API

```
GET /api/reports/product-correlation?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Response Schema (JSON):**

```json
{
  "totalAnalyses": 152,
  "totalProductsInDb": 24,
  "productsRecommended": 18,
  "coveragePercent": 75.0,

  "conditionProductMatrix": [
    {
      "condition": "acne",
      "topProducts": [
        { "productId": 3, "productName": "Salicylic Acid Cleanser", "count": 42, "percentageOfCondition": 58.3 },
        { "productId": 7, "productName": "Tea Tree Face Wash", "count": 18, "percentageOfCondition": 25.0 }
      ]
    },
    {
      "condition": "wrinkles",
      "topProducts": [
        { "productId": 12, "productName": "Retinol Night Serum", "count": 35, "percentageOfCondition": 70.0 }
      ]
    }
  ],

  "productSkinProfiles": [
    {
      "productId": 3,
      "productName": "Salicylic Acid Cleanser",
      "recommendedCount": 42,
      "averageScores": {
        "acne": 0.78,
        "blackheads": 0.45,
        "clear_skin": 0.12,
        "dark_spots": 0.22,
        "puffy_eyes": 0.09,
        "wrinkles": 0.11
      }
    }
  ]
}
```

### 3.5 Tampilan UI (Deskripsi)

- **Heatmap / Matrix Table:** Baris = `dominant_condition`, Kolom = nama produk, Cell = jumlah rekomendasi. Warna cell semakin gelap semakin sering.
- **Detail Card per Produk:** Rata-rata 6 skor user yang mendapat rekomendasi produk tersebut (bar chart mini).

---

## 4. Report 3: Skin Condition Co-occurrence & Correlation

### 4.1 Tujuan
Menganalisis hubungan (korelasi) antar 6 kondisi kulit berdasarkan skor probabilitas CNN. Jika acne dan blackheads memiliki korelasi positif tinggi, berarti CNN telah "belajar" bahwa kedua kondisi ini sering muncul bersamaan secara dermatologis.

### 4.2 Data Source
- Tabel: `analysis_logs`
- Kolom: 6 skor CNN (`acne_score` … `wrinkles_score`)

### 4.3 Metode Perhitungan

**A. Pearson Correlation Matrix**

Diberikan dua array skor (misal semua `acne_score` dan semua `blackheads_score`):

```
r = Σ((xi - x̄)(yi - ȳ)) / sqrt(Σ(xi - x̄)² × Σ(yi - ȳ)²)
```

Hitung untuk semua pasangan (6 choose 2 = 15 pasangan):
- acne ↔ blackheads
- acne ↔ clear_skin
- acne ↔ dark_spots
- acne ↔ puffy_eyes
- acne ↔ wrinkles
- blackheads ↔ clear_skin
- blackheads ↔ dark_spots
- blackheads ↔ puffy_eyes
- blackheads ↔ wrinkles
- clear_skin ↔ dark_spots
- clear_skin ↔ puffy_eyes
- clear_skin ↔ wrinkles
- dark_spots ↔ puffy_eyes
- dark_spots ↔ wrinkles
- puffy_eyes ↔ wrinkles

**B. Average Profile per Dominant Condition**

```
UNTUK setiap dominant_condition:
  Ambil SEMUA log dengan condition tersebut
  Hitung rata-rata 6 skor
```

Contoh hasil: saat `dominant_condition = 'acne'`, rata-rata skor lainnya adalah `{blackheads: 0.42, wrinkles: 0.11, clear_skin: 0.08, ...}`. Ini menunjukkan "tipe kulit acne" punya karakteristik skor sekunder seperti apa.

### 4.4 Endpoint API

```
GET /api/reports/cooccurrence?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Response Schema (JSON):**

```json
{
  "totalAnalyses": 152,

  "correlationMatrix": [
    {
      "pair": ["acne", "blackheads"],
      "correlation": 0.78,
      "strength": "strong_positive",
      "interpretation": "Acne dan blackheads sangat sering muncul bersamaan"
    },
    {
      "pair": ["clear_skin", "acne"],
      "correlation": -0.81,
      "strength": "strong_negative",
      "interpretation": "Clear skin berbanding terbalik dengan acne"
    }
    // ... 13 pasangan lainnya
  ],

  "dominantProfiles": [
    {
      "dominantCondition": "acne",
      "count": 62,
      "averageScores": {
        "acne": 0.84,
        "blackheads": 0.42,
        "clear_skin": 0.08,
        "dark_spots": 0.18,
        "puffy_eyes": 0.07,
        "wrinkles": 0.11
      }
    },
    {
      "dominantCondition": "wrinkles",
      "count": 31,
      "averageScores": {
        "acne": 0.09,
        "blackheads": 0.12,
        "clear_skin": 0.15,
        "dark_spots": 0.38,
        "puffy_eyes": 0.29,
        "wrinkles": 0.79
      }
    }
    // ... 4 kondisi lainnya
  ]
}
```

### 4.5 Tampilan UI (Deskripsi)

- **Correlation Heatmap:** Matriks 6×6, cell berisi nilai korelasi (-1 sampai +1), diwarnai merah (positif) → putih (0) → biru (negatif).
- **Radar Chart / Bar Chart:** Profile rata-rata 6 skor untuk masing-masing 6 kondisi dominan (6 radar chart, atau 1 grouped bar chart).
- **Insight Text:** Tiga pasangan korelasi terkuat ditampilkan sebagai "Key Insight" dalam bahasa natural (bisa di-hardcode mapping `strength` → kalimat).

---

## 5. Report 4: Model Confidence Distribution

### 5.1 Tujuan
Mengevaluasi seberapa "percaya diri" model CNN dalam mengklasifikasikan masing-masing 6 kondisi. Ini merupakan metrik evaluasi model standar dalam *machine learning*.

### 5.2 Data Source
- Tabel: `analysis_logs`
- Kolom: 6 skor CNN

### 5.3 Metode Perhitungan

**A. Statistik Deskriptif per Kelas**

Untuk masing-masing 6 skor, hitung:
- Mean (μ)
- Standard Deviation (σ)
- Minimum, Maximum
- Median

**B. Histogram Buckets**

Bagi rentang skor [0, 1] menjadi 10 bucket (bin width = 0.1):
```
0.00–0.10, 0.10–0.20, ..., 0.90–1.00
```
Hitung frekuensi skor tiap kelas yang jatuh di masing-masing bucket.

**C. Dominance Ratio**

Untuk tiap kelas, hitung rasio log di mana kelas tersebut menjadi `dominant_condition`. Ini menunjukkan "market share" tiap kelas.

**D. Ambiguity Detection**

Hitung jumlah (dan persentase) log di mana **selisih antara skor tertinggi dan skor tertinggi kedua < 0.10**. Ini menandakan model "ragu-ragu".

```
UNTUK setiap log:
  scores = [acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles]
  sorted = sort_descending(scores)
  IF (sorted[0] - sorted[1]) < 0.10 → flag sebagai "ambiguous"
```

### 5.4 Endpoint API

```
GET /api/reports/confidence?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Response Schema (JSON):**

```json
{
  "totalAnalyses": 152,

  "statistics": {
    "acne":    { "mean": 0.34, "stdDev": 0.28, "min": 0.01, "max": 0.97, "median": 0.29 },
    "blackheads": { "mean": 0.22, "stdDev": 0.21, "min": 0.00, "max": 0.88, "median": 0.18 },
    "clear_skin": { "mean": 0.41, "stdDev": 0.33, "min": 0.02, "max": 0.99, "median": 0.38 },
    "dark_spots": { "mean": 0.19, "stdDev": 0.19, "min": 0.00, "max": 0.91, "median": 0.14 },
    "puffy_eyes": { "mean": 0.15, "stdDev": 0.14, "min": 0.00, "max": 0.72, "median": 0.12 },
    "wrinkles":   { "mean": 0.31, "stdDev": 0.30, "min": 0.01, "max": 0.95, "median": 0.25 }
  },

  "histograms": {
    "acne": [2, 5, 12, 18, 22, 19, 15, 8, 4, 1]  // frekuensi per bucket 0.0–1.0
    // ... 5 kelas lainnya
  },

  "dominanceRatio": {
    "acne": 40.8,      // % log di mana acne adalah dominant
    "wrinkles": 20.4,
    "clear_skin": 15.1,
    "dark_spots": 10.5,
    "blackheads": 8.6,
    "puffy_eyes": 4.6
  },

  "ambiguity": {
    "ambiguousCount": 23,
    "ambiguousPercent": 15.1,
    "mostAmbiguousPairs": [
      { "conditionA": "acne", "conditionB": "blackheads", "count": 11 },
      { "conditionA": "clear_skin", "conditionB": "dark_spots", "count": 7 }
    ]
  }
}
```

### 5.5 Tampilan UI (Deskripsi)

- **Box Plot Summary (Table):** Mean, StdDev, Min, Max, Median per kelas dalam 1 tabel ringkas.
- **Histogram Chart (atau Bar Chart):** 6 histogram berdampingan atau tabbed, menunjukkan distribusi skor per kelas.
- **Donut Chart:** Dominance Ratio (persentase `dominant_condition`).
- **Alert Card:** Jika `ambiguousPercent > 20%`, tampilkan warning kuning: *"Model sering ragu-ragu; pertimbangkan retraining dengan data yang lebih banyak."*

---

## 6. Struktur Endpoint API

### 6.1 Daftar File Baru

```
src/app/api/reports/
├── trends/route.ts              # Report 1
├── product-correlation/route.ts # Report 2
├── cooccurrence/route.ts        # Report 3
└── confidence/route.ts          # Report 4
```

### 6.2 Pola Umum Setiap Endpoint

Setiap endpoint mengikuti pola yang konsisten dengan endpoint report yang sudah ada:

1. **Terima query params:** `startDate`, `endDate` (opsional, ISO string `YYYY-MM-DD`).
2. **Ambil data:** Panggil `getAllAnalysisLogs()` atau `getAnalysisLogsByDateRange(startDate, endDate)` dari `data/models.ts`.
3. **Proses di memory (JS reduce):** Karena data skala thesis (ratusan–ribuan record), proses aggregasi di JavaScript sudah cukup cepat tanpa perlu SQL kompleks.
4. **Return JSON:** Gunakan `NextResponse.json({ ... })`.

### 6.3 Helper Function Umum (Disarankan)

Buat file `src/lib/reportHelpers.ts` berisi fungsi reusable:

```typescript
// Parse recommended_product_ids CSV jadi number[]
export function parseProductIds(ids: string): number[] { ... }

// Pearson correlation antara dua array number[]
export function pearsonCorrelation(x: number[], y: number[]): number { ... }

// Group array by key
export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> { ... }

// Standard deviation
export function stdDev(values: number[]): number { ... }
```

---

## 7. Struktur UI Admin / Reports

### 7.1 Tabs Layout

Halaman `/admin/reports` saat ini sudah memiliki tampilan report utama (log table + export). Diperbarui menjadi **5 tab**:

```
┌─────────────────────────────────────────────────────────────┐
│  Analysis Logs  |  Trends  |  Product Corr.  |  Co-occurrence  |  Confidence  │
└─────────────────────────────────────────────────────────────┘
```

- **Tab 1: Analysis Logs** (existing — tabel log + filter + export xlsx/pdf)
- **Tab 2: Trends** (Report 1)
- **Tab 3: Product Correlation** (Report 2)
- **Tab 4: Co-occurrence** (Report 3)
- **Tab 5: Confidence** (Report 4)

### 7.2 Filter Global

Semua tab menggunakan filter yang sama di atas halaman:

- **Date Range:** `Start Date` (input date) — `End Date` (input date)
- **Apply Filter** button → re-fetch data dari API dengan query params.

### 7.3 Export per Tab

Setiap tab memiliki 2 tombol export di kanan atas tab content:
- **Export Excel** → memanggil client-side `xlsx` dengan data dari state
- **Export PDF** → memanggil fungsi `exportToPDF()` yang sudah ada (print HTML window) atau API server-side `/api/reports/export-pdf?trend=...` jika perlu layout khusus.

---

## 8. Jadwal Implementasi

| Hari | Task | File Utama |
|------|------|------------|
| **1** | Buat helper functions (`reportHelpers.ts`) | `src/lib/reportHelpers.ts` |
| **1** | Implementasi API Report 1: Trends | `src/app/api/reports/trends/route.ts` |
| **2** | Implementasi API Report 2: Product Correlation | `src/app/api/reports/product-correlation/route.ts` |
| **2** | Implementasi API Report 3: Co-occurrence | `src/app/api/reports/cooccurrence/route.ts` |
| **3** | Implementasi API Report 4: Confidence | `src/app/api/reports/confidence/route.ts` |
| **3–4** | Update UI `/admin/reports` — tambah 4 tab + fetch data | `src/app/admin/reports/page.tsx` |
| **4** | Tambah fitur export xlsx/pdf per tab | Reuse fungsi `exportToExcel`, `exportToPDF` |
| **5** | Testing & integrasi: filter tanggal, loading state, error handling | Semua file |

---

## Catatan Tambahan untuk Dosen Pembimbing / Sidang

- **Semua report bebas dari `user_age`:** Menghindari bias akibat data umur yang tidak terisi (nilai 0).
- **Semua report menggunakan data yang selalu ada:** `created_at`, 6 skor CNN, `dominant_condition`, `recommended_product_ids`.
- **Report 2 & 3 memiliki nilai validasi ilmiah:** Report 2 memvalidasi sistem rekomendasi *rule-based*, Report 3 memvalidasi CNN telah mempelajari pola dermatologis yang logis.
- **Report 4 merupakan metrik evaluasi ML standar:** Histogram distribusi skor dan deteksi ambiguity adalah praktik umum dalam paper *deep learning* untuk computer vision.
- **Report 1 memberikan bukti *real-world usage*:** Grafik tren penggunaan menunjukkan aplikasi tidak hanya berjalan teknis, tapi benar-benar diuji oleh pengguna.

---

*Dokumen ini siap digunakan sebagai acuan implementasi, bahan revisi ke dosen, atau lampiran BAB III (Metodologi) / BAB IV (Hasil) pada laporan tugas akhir.*
