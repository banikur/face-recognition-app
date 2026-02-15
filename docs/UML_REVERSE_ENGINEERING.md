# UML Reverse Engineering — Face Recognition App

Dokumen ini merepresentasikan **implementasi aktual** codebase (bukan desain konseptual). Setiap elemen UML dapat ditelusuri ke file/fungsi tertentu.

---

## 1. Struktur Folder & Entry Point

### 1.1 Entry point aplikasi

| Konsep | Path / File | Keterangan |
|--------|-------------|------------|
| Aplikasi | Next.js 15 (App Router) | `package.json` → `"next": "15.5.9"` |
| Root layout | `src/app/layout.tsx` | RootLayout → ModelLoader → AppShell → {children} |
| Routing | `src/app/**/page.tsx` | Setiap folder app = route segment |
| API | `src/app/api/**/route.ts` | GET/POST/PUT/DELETE handler per segment |

### 1.2 Struktur folder relevan

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home (scan & rekomendasi)
│   ├── login/page.tsx
│   ├── products/page.tsx
│   ├── recommendations/page.tsx
│   ├── campaign/page.tsx
│   ├── admin/
│   │   ├── layout.tsx          # Auth guard, AdminSidebar
│   │   ├── page.tsx            # Dashboard
│   │   ├── brands/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── ingredients/page.tsx
│   │   ├── recommendations/page.tsx
│   │   ├── products/page.tsx
│   │   ├── rules/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── export/page.tsx
│   │   └── dashboard/page.tsx  # Alternatif dashboard (client)
│   └── api/
│       ├── analysis/route.ts
│       ├── analysis/save-from-scan/route.ts
│       ├── analysis-logs/route.ts
│       ├── login/route.ts
│       ├── logout/route.ts
│       ├── auth/session/route.ts
│       ├── products/route.ts
│       ├── products/[id]/route.ts
│       ├── dataset/route.ts
│       ├── training-info/route.ts
│       └── reports/
│           ├── summary/route.ts
│           ├── export-csv/route.ts
│           ├── export-xlsx/route.ts
│           ├── export-json/route.ts
│           └── export-pdf/route.ts
├── components/                  # UI components
├── lib/                         # skinAnalyzer, cnnSkinClassifier, faceDetection, supabaseClient, simple-auth
└── ...
data/
├── models.ts                    # Data layer (Supabase CRUD)
├── init.ts, inject-data.ts, check-seed.ts
config/
└── deploy-db.ts                 # getDatabaseUrl (pg)
```

### 1.3 Route → Controller → Model

Tidak ada folder `controllers` atau `services` terpisah. Peran controller dipegang oleh **Route Handlers** (`src/app/api/**/route.ts`); **service** = logika di dalam route atau pemanggilan langsung ke `data/models.ts`.

| Layer | Implementasi |
|-------|---------------|
| Controller | `src/app/api/**/route.ts` (export GET/POST/PUT/DELETE) |
| Service | Inline di route (e.g. `calculateScore`, `getRecommendations` di save-from-scan) atau pemanggilan models |
| Model / Data | `data/models.ts` (Supabase client: `.from('table')`) |

---

## 2. Use Case Diagram (berdasarkan endpoint/route nyata)

Use case berikut hanya mencakup fitur yang **benar-benar ada** di code (route + halaman).

### 2.1 Alur rekomendasi produk (aktual)

**Rekomendasi produk tidak memakai tabel `rules`.** Alur yang dipakai:

1. **Ingredients** — Admin set bobot per kondisi CNN (w_acne, w_blackheads, …) via form CRUD.
2. **Products** — Admin link produk ke ingredients via `product_ingredients`. Bobot produk dihitung otomatis dari agregat bobot ingredients (`setProductIngredients` → `calculateWeights`).
3. **Scan** — CNN keluarkan 6 skor → dot product dengan bobot produk → urutkan, ambil top 3.

```
skor_CNN × bobot_produk = score_per_produk
Top 3 produk by score
```

File: `src/app/api/analysis/save-from-scan/route.ts` — `getAllProducts()`, `calculateScore()`, **tidak** memanggil `getAllRules()`.

### 2.2 Admin CRUD yang benar-benar ada form & insert ke table

| CRUD | Form fields | Insert ke table | Dipakai dalam rekomendasi? |
|------|-------------|-----------------|----------------------------|
| Brands | name, logo_url | brands | Ya (referensi produk) |
| Categories | name, description | product_categories | Ya (referensi produk) |
| Ingredients | name, effect, w_acne..w_wrinkles (6 slider) | ingredients | **Ya — sumber bobot** |
| Recommendations | condition, title, description, tips | recommendations | Tidak (metadata/tips per kondisi) |
| Products | name, brand_id, category_id, description, image_url, ingredient_ids | products, product_ingredients | **Ya — bobot dari ingredients** |
| Rules | skin_type_id, product_id, confidence_score | rules | **Tidak — tabel rules tidak dipakai di save-from-scan** |

Rules punya form CRUD di `/admin/rules`, tapi **tabel `rules` tidak digunakan** dalam alur rekomendasi. Rekomendasi berasal dari perhitungan dot product (skor × bobot produk), bukan dari rules.

### 2.3 Mapping: Use Case ↔ Route/File ↔ Fungsi

| Use Case | Route / Halaman | File | Fungsi utama |
|----------|-----------------|------|----------------|
| Scan wajah & dapat rekomendasi | POST /api/analysis/save-from-scan | `src/app/api/analysis/save-from-scan/route.ts` | `POST()` → getDominantCondition, getRecommendations (dot product), createAnalysisLog |
| Simpan hasil analisis (programmatic) | POST /api/analysis | `src/app/api/analysis/route.ts` | `POST()` → getRecommendations, getDominantCondition, createAnalysisLog |
| Lihat daftar produk | GET /api/products | `src/app/api/products/route.ts` | `GET()` → getAllProducts |
| Buat produk | POST /api/products | `src/app/api/products/route.ts` | `POST()` → getAllBrands, getAllIngredients, createProduct |
| Ambil/ubah/hapus produk by ID | GET/PUT/DELETE /api/products/[id] | `src/app/api/products/[id]/route.ts` | getProductById, updateProduct, deleteProduct |
| Login admin | POST /api/login | `src/app/api/login/route.ts` | `POST()` → Pool (pg), bcrypt.compare, createSession |
| Logout | POST /api/logout | `src/app/api/logout/route.ts` | invalidate session |
| Cek session | GET /api/auth/session | `src/app/api/auth/session/route.ts` | getSession |
| Daftar analysis logs (filter opsional) | GET /api/analysis-logs | `src/app/api/analysis-logs/route.ts` | getAllAnalysisLogs, getAnalysisLogsByDateRange, getAnalysisLogsByCondition |
| Ringkasan report | GET /api/reports/summary | `src/app/api/reports/summary/route.ts` | getAllAnalysisLogs / getAnalysisLogsByDateRange → agregasi conditionDistribution, topRecommendedProducts |
| Export CSV | GET /api/reports/export-csv | `src/app/api/reports/export-csv/route.ts` | getAllAnalysisLogs, getAllProducts → CSV |
| Export XLSX | GET /api/reports/export-xlsx | `src/app/api/reports/export-xlsx/route.ts` | getAnalysisLogsByDateRange / getAllAnalysisLogs → XLSX |
| Export JSON | GET /api/reports/export-json | `src/app/api/reports/export-json/route.ts` | getAllAnalysisLogs, getAllProducts, getAllSkinTypes → JSON |
| Export PDF | GET /api/reports/export-pdf | `src/app/api/reports/export-pdf/route.ts` | getAnalysisLogsByDateRange / getAllAnalysisLogs → PDFKit |
| **Admin CRUD Brands** | /admin/brands | `src/app/admin/brands/page.tsx` | getBrandsAction, createBrandAction, updateBrandAction, deleteBrandAction |
| **Admin CRUD Categories** | /admin/categories | `src/app/admin/categories/page.tsx` | getCategoriesAction, createCategoryAction, updateCategoryAction, deleteCategoryAction |
| **Admin CRUD Ingredients** | /admin/ingredients | `src/app/admin/ingredients/page.tsx` | getIngredientsAction, createIngredientAction, updateIngredientAction, deleteIngredientAction |
| **Admin CRUD Recommendations** | /admin/recommendations | `src/app/admin/recommendations/page.tsx` | getRecommendationsAction, createRecommendationAction, updateRecommendationAction, deleteRecommendationAction |
| **Admin CRUD Products** | /admin/products | `src/app/admin/products/page.tsx` | getProductsAction, createProductAction, updateProductAction, deleteProductAction; setProductIngredients (bobot otomatis) |
| Admin: Rules (CRUD form ada, tabel **tidak dipakai** rekomendasi) | /admin/rules | `src/app/admin/rules/page.tsx` | getRulesAction, createRuleAction, updateRuleAction, deleteRuleAction — **tidak dipanggil di save-from-scan** |
| Admin: lihat Reports | /admin/reports | `src/app/admin/reports/page.tsx` | getAnalysisLogsAction, getSkinTypesAction, getAnalysisStatsAction, filter client-side |
| Admin: export (halaman) | /admin/export | `src/app/admin/export/page.tsx` | Link ke export CSV/XLSX/JSON/PDF |
| Admin: dashboard | /admin | `src/app/admin/page.tsx` | getAnalysisStatsAction → totalAnalysis, totalProducts, conditionCounts, recentLogs |
| Admin: Skin Types (link di dashboard) | /admin/skin-types | — | Tidak ada page.tsx; CRUD kondisi pakai /admin/recommendations |
| User: halaman scan (home) | / | `src/app/page.tsx` | CameraPanel → analyzeSkin → POST save-from-scan → ResultPanel, RecommendationCard |
| User: halaman produk | /products | `src/app/products/page.tsx` | GET /api/products → filter by w_* |
| User: halaman rekomendasi by condition | /recommendations?condition= | `src/app/recommendations/page.tsx` | GET /api/products → sort by w_{condition} |

---

## 3. Activity Diagram (per use case)

### 3.1 Use case: Scan wajah & dapat rekomendasi

Alur aktual: `src/app/page.tsx` → `CameraPanel` → `skinAnalyzer` → `POST /api/analysis/save-from-scan`.

```
[User buka /] --> [ModelLoader load]
[ModelLoader load] --> [CameraPanel mount]
[CameraPanel mount] --> [getUserMedia / pilih upload]
[User capture/upload] --> [analyzeSkin(video/image)]
[analyzeSkin] --> captureFrame
captureFrame --> detectFacePresenceWithCNN
detectFacePresenceWithCNN --> {wajah terdeteksi?}
{wajah terdeteksi?} --tidak--> [return faceDetected: false]
{wajah terdeteksi?} --ya--> classifySkin(imageData)
classifySkin --> probabilitiesToScores
probabilitiesToScores --> [return AnalysisResult]
[return AnalysisResult] --> [handleCapture di page.tsx]
[handleCapture] --> [POST /api/analysis/save-from-scan]
[POST] --> {scores ada?}
{scores ada?} --tidak--> [400 Missing scores]
{scores ada?} --ya--> getDominantCondition(scores)
getDominantCondition --> getRecommendations(scores)
getRecommendations --> getAllProducts --> calculateScore per produk --> sort, slice(0,3)
getRecommendations --> createAnalysisLog(...)
createAnalysisLog --> [201 JSON: id, dominant_condition, recommendations]
[201] --> [setRecommendations di Home]
[setRecommendations] --> [ResultPanel + RecommendationCard render]
```

**File/fungsi:**  
- `src/app/page.tsx`: `handleCapture`, state `analysis`, `recommendations`.  
- `src/components/CameraPanel.tsx`: capture/upload, panggil `analyzeSkin`.  
- `src/lib/skinAnalyzer.ts`: `analyzeSkin`, `captureFrame`, `detectFacePresenceWithCNN`; memanggil `classifySkin` (cnnSkinClassifier), `detectFaces` (faceDetection).  
- `src/app/api/analysis/save-from-scan/route.ts`: `POST`, `calculateScore`, `getRecommendations`, `getDominantCondition`, `createAnalysisLog`.

### 3.2 Use case: Admin kelola Ingredients

Alur: `src/app/admin/ingredients/page.tsx` → actions → models.

```
[User buka /admin/ingredients] --> [useEffect: getIngredientsAction]
getIngredientsAction --> getAllIngredients (models) --> Supabase .from('ingredients').select
[Data tampil] --> [User klik Tambah / Edit]
[User isi form] --> handleSubmit
handleSubmit --> {editingIngredient?}
{editingIngredient?} --ya--> updateIngredientAction(id, formData)
{editingIngredient?} --tidak--> createIngredientAction(formData)
updateIngredientAction --> updateIngredient (models) --> revalidatePath('/admin/ingredients')
createIngredientAction --> createIngredient (models) --> revalidatePath
[setShowForm false, fetchData] --> [getIngredientsAction lagi]
```

**File:** `src/app/admin/ingredients/page.tsx` (getIngredientsAction, createIngredientAction, updateIngredientAction, deleteIngredientAction), `src/app/admin/actions.ts`, `data/models.ts` (getAllIngredients, createIngredient, updateIngredient, deleteIngredient).

### 3.3 Use case: Admin CRUD Brands

Alur: `src/app/admin/brands/page.tsx` → `src/app/admin/actions.ts` → `data/models.ts`.

```
[User buka /admin/brands] --> [useEffect: getBrandsAction]
getBrandsAction --> getAllBrands (models) --> Supabase .from('brands').select()
[Data tampil di tabel] --> [User klik Add Brand / Edit]
[User isi form name, logo_url] --> handleSubmit
handleSubmit --> {editingBrand?}
{editingBrand?} --ya--> updateBrandAction(id, formData)
{editingBrand?} --tidak--> createBrandAction(formData)
updateBrandAction --> updateBrand (models) --> revalidatePath('/admin/brands')
createBrandAction --> createBrand (models) --> revalidatePath
[setShowForm false, fetchData] --> [getBrandsAction lagi]
[User klik Delete] --> confirm --> deleteBrandAction(id) --> deleteBrand (models)
```

**File:** `src/app/admin/brands/page.tsx`, `src/app/admin/actions.ts` (createBrandAction, updateBrandAction, deleteBrandAction), `data/models.ts` (createBrand, updateBrand, deleteBrand).

### 3.4 Use case: Admin CRUD Categories

```
[User buka /admin/categories] --> [useEffect: getCategoriesAction]
getCategoriesAction --> getAllCategories (models) --> Supabase .from('product_categories').select()
[Data tampil] --> [User klik Add Category / Edit]
[User isi form name, description] --> handleSubmit
handleSubmit --> {editingCategory?}
{editingCategory?} --ya--> updateCategoryAction(id, formData)
{editingCategory?} --tidak--> createCategoryAction(formData)
updateCategoryAction --> updateCategory (models) --> revalidatePath('/admin/categories')
createCategoryAction --> createCategory (models) --> revalidatePath
[fetchData] --> [getCategoriesAction lagi]
[User klik Delete] --> deleteCategoryAction(id) --> deleteCategory (models)
```

**File:** `src/app/admin/categories/page.tsx`, `src/app/admin/actions.ts`, `data/models.ts` (getAllCategories, createCategory, updateCategory, deleteCategory).

### 3.5 Use case: Admin CRUD Recommendations

```
[User buka /admin/recommendations] --> [useEffect: getRecommendationsAction]
getRecommendationsAction --> getAllRecommendations (models) --> Supabase .from('recommendations').select()
[Data tampil (condition, title, description, tips)] --> [User klik Add / Edit]
[User isi form condition, title, description, tips (JSON array)] --> handleSubmit
handleSubmit --> {editingRec?}
{editingRec?} --ya--> updateRecommendationAction(id, data)
{editingRec?} --tidak--> createRecommendationAction(data)
updateRecommendationAction --> updateRecommendation (models) --> revalidatePath('/admin/recommendations')
createRecommendationAction --> createRecommendation (models) --> revalidatePath
[fetchData] --> [getRecommendationsAction lagi]
[User klik Delete] --> deleteRecommendationAction(id) --> deleteRecommendation (models)
```

**File:** `src/app/admin/recommendations/page.tsx`, `src/app/admin/actions.ts`, `data/models.ts` (getAllRecommendations, createRecommendation, updateRecommendation, deleteRecommendation).

### 3.6 Use case: Admin CRUD Products

Products punya tambahan: link ke ingredients → bobot produk dihitung otomatis dari agregat bobot ingredients.

```
[User buka /admin/products] --> [useEffect: getProductsAction, getBrandsAction, getCategoriesAction, getIngredientsAction]
[Data tampil] --> [User klik Add Product / Edit]
[User isi form name, brand_id, category_id, description, image_url] --> [User pilih ingredient_ids (toggle)]
handleSubmit --> {editingProduct?}
{editingProduct?} --ya--> updateProductAction(id, { ...formData, ingredient_ids })
{editingProduct?} --tidak--> createProductAction({ ...formData, ingredient_ids })
createProductAction --> createProduct (models) --> insert products
createProduct --> setProductIngredients(productId, ingredient_ids)
setProductIngredients --> delete product_ingredients lama
setProductIngredients --> insert product_ingredients baru
setProductIngredients --> calculateWeights(ingredientIds) --> getIngredientById per id
setProductIngredients --> UPDATE products SET w_acne..w_wrinkles = agregat dari ingredients
updateProductAction --> updateProduct + setProductIngredients (jika ingredient_ids berubah)
[fetchData] --> [getProductsAction lagi]
[User klik Delete] --> deleteProductAction(id) --> deleteProduct (models)
```

**File:** `src/app/admin/products/page.tsx`, `src/app/admin/actions.ts`, `data/models.ts` (createProduct, updateProduct, setProductIngredients, calculateWeights, deleteProduct).

### 3.7 Use case: Login admin

```
[User POST /api/login] --> [body: email, password]
[Validasi email & password ada] --> {valid?}
{valid?} --tidak--> [400]
{valid?} --ya--> [getDatabaseUrl] --> Pool(pg)
[Pool] --> SELECT admin_users WHERE email = $1
{row ada?} --tidak--> [401]
{row ada?} --ya--> bcrypt.compare(password, row.password_hash)
{compare ok?} --tidak--> [401]
{compare ok?} --ya--> createSession({ id, email })
createSession --> [200 { ok: true }]
```

**File:** `src/app/api/login/route.ts` (POST, Pool, bcrypt, createSession dari `@/lib/simple-auth`).

---

## 4. Sequence Diagram (trace call stack aktual)

### 4.1 Scan wajah → rekomendasi (alur lengkap)

```
Actor          Home(page)    CameraPanel    skinAnalyzer    faceDetection   cnnSkinClassifier   save-from-scan route   models
  |                  |              |              |                |                    |                        |              |
  | buka /           |              |              |                 |                    |                        |              |
  |----------------->|              |              |                 |                    |                        |              |
  |                  | mount        |              |                 |                    |                        |              |
  |                  |------------->|              |                 |                    |                        |              |
  |                  |              | getUserMedia |                 |                    |                        |              |
  | capture          |              |              |                 |                    |                        |              |
  |----------------->|              |              |                 |                    |                        |              |
  |                  | onCapture    |              |                 |                    |                        |              |
  |                  |------------->| analyzeSkin  |                 |                    |                        |              |
  |                  |              |------------->| captureFrame    |                    |                        |              |
  |                  |              |              |----------------| detectFaces       |                        |              |
  |                  |              |              |                 |----------------->|                        |              |
  |                  |              |              |                 | (face result)     |                        |              |
  |                  |              |              | classifySkin    |                    |                        |              |
  |                  |              |              |--------------------------------------->|                        |              |
  |                  |              |              |                 |                    | loadSkinModel, predict |              |
  |                  |              |              | AnalysisResult  |                    |                        |              |
  |                  |              |<-------------|----------------|--------------------|                        |              |
  |                  | handleCapture(scores, skinType)                 |                        |              |
  |                  |<-------------|              |                 |                    |                        |              |
  |                  | POST /api/analysis/save-from-scan              |                        |              |
  |                  |----------------------------------------------------------------------->|              |
  |                  |              |              |                 |                    |   getDominantCondition  |              |
  |                  |              |              |                 |                    |   getRecommendations    |              |
  |                  |              |              |                 |                    |   getAllProducts        |              |
  |                  |              |              |                 |                    |------------------------->|              |
  |                  |              |              |                 |                    |   createAnalysisLog     |              |
  |                  |              |              |                 |                    |------------------------->|              |
  |                  |              |              |                 |                    |   .from('analysis_logs').insert        |
  |                  | 201 { id, dominant_condition, recommendations } |                        |              |
  |                  |<-----------------------------------------------------------------------|              |
  |                  | setRecommendations(data.recommendations)        |                        |              |
  | ResultPanel + RecommendationCard render                          |                        |              |
  |<-----------------|              |              |                 |                    |                        |              |
```

### 4.2 Admin CRUD Brands

Sesuai Activity 3.3: `admin/brands/page.tsx` → `actions.ts` → `models.ts` → Supabase.

```
Actor    brands/page.tsx      actions.ts         models.ts              Supabase
  |              |                 |                    |                    |
  | Edit, Submit |                 |                    |                    |
  |------------->|                 |                    |                    |
  |              | updateBrandAction(id, formData)      |                    |
  |              |---------------->|                    |                    |
  |              |                 | updateBrand(id, data)                  |
  |              |                 |------------------->|                    |
  |              |                 |                    | .from('brands').update().eq('id',id)
  |              |                 |                    |--------------------->|
  |              |                 | revalidatePath('/admin/brands')        |
  |              |<----------------|                    |                    |
  |              | fetchData() -> getBrandsAction       |                    |
  |              |---------------->| getAllBrands       |                    |
  |              |                 |------------------->| .from('brands').select()
  |              | setBrands(data) |<-------------------|                    |
```

### 4.3 Admin CRUD Categories

Sesuai Activity 3.4: `admin/categories/page.tsx` → `actions.ts` → `models.ts` → Supabase.

```
Actor    categories/page.tsx  actions.ts         models.ts              Supabase
  |              |                 |                    |                    |
  | Edit, Submit |                 |                    |                    |
  |------------->|                 |                    |                    |
  |              | updateCategoryAction(id, formData)   |                    |
  |              |---------------->|                    |                    |
  |              |                 | updateCategory(id, data)               |
  |              |                 |------------------->|                    |
  |              |                 |                    | .from('product_categories').update().eq('id',id)
  |              |                 |                    |--------------------->|
  |              |                 | revalidatePath('/admin/categories')    |
  |              |<----------------|                    |                    |
  |              | fetchData() -> getCategoriesAction   |                    |
  |              |---------------->| getAllCategories   |                    |
  |              |                 |------------------->| .from('product_categories').select()
  |              | setCategories(data)                  |                    |
  |              |<----------------|                    |                    |
```

### 4.4 Admin CRUD Ingredients

Sesuai Activity 3.2: `admin/ingredients/page.tsx` → `actions.ts` → `models.ts` → Supabase.

```
Actor    ingredients/page.tsx actions.ts         models.ts              Supabase
  |              |                 |                    |                    |
  | Edit, Submit |                 |                    |                    |
  |------------->|                 |                    |                    |
  |              | updateIngredientAction(id, formData) |                    |
  |              |---------------->|                    |                    |
  |              |                 | updateIngredient(id, data)             |
  |              |                 |------------------->|                    |
  |              |                 |                    | .from('ingredients').update().eq('id',id)
  |              |                 |                    |--------------------->|
  |              |                 | revalidatePath('/admin/ingredients')   |
  |              |<----------------|                    |                    |
  |              | fetchData() -> getIngredientsAction  |                    |
  |              |---------------->| getAllIngredients  |                    |
  |              |                 |------------------->| .from('ingredients').select()
  |              | setIngredients(data)                 |                    |
  |              |<----------------|                    |                    |
```

### 4.5 Admin CRUD Recommendations

Sesuai Activity 3.5: `admin/recommendations/page.tsx` → `actions.ts` → `models.ts` → Supabase.

```
Actor    recommendations/page.tsx  actions.ts    models.ts              Supabase
  |              |                      |              |                    |
  | Edit, Submit |                      |              |                    |
  |------------->|                      |              |                    |
  |              | updateRecommendationAction(id, data)|                    |
  |              |---------------------->|              |                    |
  |              |                       | updateRecommendation(id, data)   |
  |              |                       |--------------->|                    |
  |              |                       |                | .from('recommendations').update().eq('id',id)
  |              |                       |                |---------------------->|
  |              |                       | revalidatePath('/admin/recommendations')
  |              |<----------------------|                |                    |
  |              | fetchData() -> getRecommendationsAction                   |
  |              |---------------------->| getAllRecommendations             |
  |              |                       |--------------->| .from('recommendations').select()
  |              | setRecommendations(data)               |                    |
  |              |<----------------------|                |                    |
```

### 4.6 Admin CRUD Products (dengan setProductIngredients)

Sesuai Activity 3.6: Products berbeda — setelah create/update, perlu `setProductIngredients` yang menghitung bobot produk dari ingredients.

```
Actor    admin/products/page.tsx   actions.ts         models.ts              Supabase
  |              |                      |                    |                    |
  | Submit form (name, brand_id, category_id, ingredient_ids) |                    |
  |------------->|                      |                    |                    |
  |              | createProductAction({ name, brand_id, ..., ingredient_ids })   |
  |              |------------------->|                    |                    |
  |              |                      | createProduct(data)                    |
  |              |                      |------------------>| .from('products').insert()
  |              |                      |                    |-------------------->|
  |              |                      | setProductIngredients(productId, ingredient_ids)
  |              |                      |------------------>|                    |
  |              |                      |                    | .from('product_ingredients').delete().eq(product_id)
  |              |                      |                    | .from('product_ingredients').insert([...])
  |              |                      |                    | getIngredientById per id → agregat w_acne..w_wrinkles
  |              |                      |                    | .from('products').update({ w_acne..w_wrinkles }).eq(id)
  |              |                      |                    |-------------------->|
  |              |                      | revalidatePath('/admin/products')     |
  |              |<---------------------|                    |                    |
  |              | fetchData() -> getProductsAction         |                    |
  |              |------------------->| getAllProducts      |                    |
  |              | setProducts(data)    |<-------------------|                    |
```

### 4.7 Login admin

Sesuai Activity 3.7: `POST /api/login` → Pool (pg) → bcrypt → createSession.

```
Actor    login/page.tsx    POST /api/login    Pool (pg)    bcrypt    simple-auth
  |              |                |               |           |            |
  | Submit email, password |      |               |           |            |
  |------------->|                |               |           |            |
  |              | POST /api/login|               |           |            |
  |              |--------------->|               |           |            |
  |              |                | SELECT admin_users WHERE email = $1   |
  |              |                |--------------->|           |            |
  |              |                | row            |           |            |
  |              |                |<---------------|           |            |
  |              |                | bcrypt.compare(password, row.password_hash)
  |              |                |---------------------------->|            |
  |              |                | ok            |           |            |
  |              |                |<----------------------------|            |
  |              |                | createSession({ id, email }) |            |
  |              |                |----------------------------------------->|
  |              | 200 { ok: true }|               |           |            |
  |              |<---------------|               |           |            |
```

---

## 5. Class Diagram (berdasarkan interface/tipe & fungsi nyata)

Model data dan layer akses ada di `data/models.ts` + Supabase. Tidak ada class OOP; yang ada **interface** + **function** export.

### 5.1 Entity (interface) & Tabel

| Interface | File | Tabel Supabase | Atribut (aktual) |
|-----------|------|----------------|-------------------|
| Brand | data/models.ts | brands | id, name, logo_url, created_at |
| ProductCategory | data/models.ts | product_categories | id, name, description, created_at |
| Ingredient | data/models.ts | ingredients | id, name, effect, w_acne, w_blackheads, w_clear_skin, w_dark_spots, w_puffy_eyes, w_wrinkles, created_at |
| Recommendation | data/models.ts | recommendations | id, condition, title, description, tips, created_at |
| Product | data/models.ts | products | id, name, brand_id, category_id, description, image_url, w_acne..w_wrinkles (6), created_at; optional: brand_name, category_name |
| ProductIngredient | data/models.ts | product_ingredients | product_id, ingredient_id |
| AnalysisLog | data/models.ts | analysis_logs | id, user_name, user_email, user_phone, user_age, acne_score..wrinkles_score (6), dominant_condition, recommended_product_ids, created_at |
| SkinType | data/models.ts | (legacy, map ke Recommendation) | id, name, description, created_at |
| Rule | data/models.ts | rules | id, skin_type_id, product_id, confidence_score |

### 5.2 Data layer (models.ts) — fungsi per entity

| Fungsi | File | Keterangan |
|--------|------|------------|
| getAllBrands, getBrandById, createBrand, updateBrand, deleteBrand | data/models.ts | CRUD brands |
| getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory | data/models.ts | CRUD product_categories |
| getAllIngredients, getIngredientById, createIngredient, updateIngredient, deleteIngredient | data/models.ts | CRUD ingredients |
| getAllRecommendations, getRecommendationById, getRecommendationByCondition, createRecommendation, updateRecommendation, deleteRecommendation | data/models.ts | CRUD recommendations |
| getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, setProductIngredients | data/models.ts | CRUD products + product_ingredients; bobot produk dihitung dari ingredients |
| getAllAnalysisLogs, getAnalysisLogById, getAnalysisLogsByDateRange, getAnalysisLogsByCondition, createAnalysisLog, deleteAnalysisLog | data/models.ts | CRUD analysis_logs |
| getAllSkinTypes, getSkinTypeById, createSkinType, updateSkinType, deleteSkinType | data/models.ts | Legacy; delegasi ke recommendations |
| getAllRules, createRule, updateRule, deleteRule | data/models.ts | CRUD rules |
| calculateWeights(ingredientIds) | data/models.ts | Agregat bobot 6 dimensi dari ingredients |

### 5.3 Relasi (dari schema & kode)

- **Product** → brand_id → **Brand** (FK)
- **Product** → category_id → **ProductCategory** (FK)
- **Product** ↔ **Ingredient**: many-to-many via **ProductIngredient** — **sumber bobot produk** (setProductIngredients → calculateWeights → UPDATE products.w_acne..w_wrinkles)
- **Rule**: skin_type_id → **Recommendation** (id), product_id → **Product** (id) — **tidak dipakai** di save-from-scan atau API rekomendasi
- **AnalysisLog**: tidak ada FK ke entity lain; recommended_product_ids = string CSV id produk

### 5.4 Lib & tipe lain (bukan entity DB)

| Tipe / Objek | File | Keterangan |
|--------------|------|------------|
| SkinScores, CNNPrediction | src/lib/cnnSkinClassifier.ts | Label: acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles |
| AnalysisResult | src/lib/skinAnalyzer.ts | skinType, scores, faceDetected, imageData?, confidence? |
| FaceDetectionResult, FaceBoundingBox | src/lib/faceDetection.ts | faceDetected, confidence?, boundingBox? |

---

## 6. Rancangan Layar (berdasarkan komponen/halaman yang ada)

### 6.1 Struktur layout global

- **Root**: `layout.tsx` → ModelLoader → AppShell → children  
- **AppShell** (`components/AppShell.tsx`): jika pathname !== '/login' → TopBar + main; jika login → children only  
- **Admin**: `admin/layout.tsx` → getSession; jika !user redirect /login → AdminSidebar + header (breadcrumb, user email, form POST /api/logout) + main {children}

### 6.2 Halaman & komponen utama

| Halaman / Route | Layout | Komponen utama | Sumber |
|-----------------|--------|----------------|--------|
| / | AppShell + TopBar | Home: CameraPanel, ResultPanel, RecommendationCard | src/app/page.tsx |
| /login | AppShell (no TopBar) | Form login | src/app/login/page.tsx |
| /products | AppShell | Daftar produk, filter by w_* | src/app/products/page.tsx |
| /recommendations | AppShell | Daftar produk by condition (query) | src/app/recommendations/page.tsx |
| /campaign | AppShell | Halaman campaign | src/app/campaign/page.tsx |
| /admin | Admin layout | Dashboard: KPI cards, tools grid, recent activity | src/app/admin/page.tsx |
| /admin/brands | Admin layout | Tabel + form CRUD brands | src/app/admin/brands/page.tsx |
| /admin/categories | Admin layout | Tabel + form CRUD categories | src/app/admin/categories/page.tsx |
| /admin/ingredients | Admin layout | Tabel + form CRUD ingredients (6 slider bobot) | src/app/admin/ingredients/page.tsx |
| /admin/recommendations | Admin layout | CRUD recommendations (condition, title, description, tips) | src/app/admin/recommendations/page.tsx |
| /admin/products | Admin layout | CRUD products, link ingredients | src/app/admin/products/page.tsx |
| /admin/rules | Admin layout | CRUD rules (skin_type_id, product_id, confidence_score) | src/app/admin/rules/page.tsx |
| /admin/reports | Admin layout | Filter (date, condition, product), tabel logs, stat | src/app/admin/reports/page.tsx |
| /admin/export | Admin layout | Link export CSV/XLSX/JSON/PDF | src/app/admin/export/page.tsx |
| /admin/dashboard | Admin layout | Alternatif dashboard (client-side fetch) | src/app/admin/dashboard/page.tsx |

### 6.3 Komponen UI (file)

| Komponen | File | Peran |
|----------|------|--------|
| ModelLoader | src/components/ModelLoader.tsx | Load model (context/provider) untuk TF/Skin |
| AppShell | src/components/AppShell.tsx | Conditional TopBar + main |
| TopBar | src/components/TopBar.tsx | Navbar atas (link, dsb.) |
| CameraPanel | src/components/CameraPanel.tsx | Video/upload, capture, panggil analyzeSkin, onCapture |
| ResultPanel | src/components/ResultPanel.tsx | Tampil skinType, scores, confidence, faceDetected |
| RecommendationCard | src/components/RecommendationCard.tsx | Tampil daftar rekomendasi produk |
| AdminSidebar | src/components/AdminSidebar.tsx | Sidebar admin (navItems, masterDataItems, transactionalItems) |
| TrainingInfoCard | src/components/TrainingInfoCard.tsx | Kartu info training (bisa pakai data dari API) |

---

## 7. Tampilan Layar — mapping ke file JSX/TSX

| Tampilan | File TSX/JSX | Elemen utama (aktual) |
|----------|--------------|------------------------|
| Home (scan) | src/app/page.tsx | flex/grid: kiri CameraPanel, kanan ResultPanel + RecommendationCard; state analysis, recommendations, isAnalyzing |
| Login | src/app/login/page.tsx | Form email/password, submit POST /api/login |
| Daftar produk (user) | src/app/products/page.tsx | Filter tabs (all, acne, blackheads, …), grid kartu produk, skinTags dari w_* |
| Rekomendasi by condition | src/app/recommendations/page.tsx | searchParams condition, fetch /api/products, sort by w_{condition}, slice 6 |
| Admin dashboard | src/app/admin/page.tsx | KPI cards (totalAnalysis, totalProducts, uniqueUsers), tools grid (Products, Skin Types, Ingredients, Reports), recent logs (user_name, dominant_condition, scores) |
| Admin ingredients | src/app/admin/ingredients/page.tsx | Tabel ingredients; form name, effect, 6 slider (w_acne..w_wrinkles); createIngredientAction, updateIngredientAction, deleteIngredientAction |
| Admin products | src/app/admin/products/page.tsx | Tabel produk + bobot 6 dimensi; form/create/edit produk + ingredient assignment |
| Admin reports | src/app/admin/reports/page.tsx | Filter startDate, endDate, skinCondition, productId; tabel logs; stat Top Products, Condition distribution; getConditionBadge(dominant_condition) |

---

## 8. Ringkasan Dokumen UML

### Jenis UML dan deskripsi

| No | Jenis | Total | Daftar | Deskripsi |
|----|-------|-------|--------|-----------|
| 1 | **Use Case Diagram** | 1 | Use Case Diagram (route/endpoint aktual) | Diagram use case berdasarkan route dan endpoint nyata; memetakan actor (User, Admin) ke use case seperti Scan & rekomendasi, Admin CRUD (5), Reports, dsb. Termasuk alur rekomendasi (dot product) dan catatan bahwa tabel Rules tidak dipakai. |
| 2 | **Activity Diagram** | 7 | (1) Scan wajah & dapat rekomendasi, (2) Admin CRUD Ingredients, (3) Admin CRUD Brands, (4) Admin CRUD Categories, (5) Admin CRUD Recommendations, (6) Admin CRUD Products, (7) Login admin | Alur aktivitas per use case; menunjukkan langkah dan decision branch sesuai implementasi kode (mis. wajah terdeteksi?, scores ada?, editing?). |
| 3 | **Sequence Diagram** | 7 | (1) Scan wajah → save-from-scan → response, (2) Admin CRUD Brands, (3) Admin CRUD Categories, (4) Admin CRUD Ingredients, (5) Admin CRUD Recommendations, (6) Admin CRUD Products (dengan setProductIngredients), (7) Login admin | Trace call stack aktual per use case; satu sequence per activity. Actor → Page/Action → Models → Supabase; menggambarkan urutan pemanggilan fungsi spesifik. |
| 4 | **Class Diagram** | 1 | Class Diagram (entity & data layer) | Daftar interface dan relasi di `data/models.ts`; entity (Brand, Ingredient, Product, AnalysisLog, Rule, dsb.) beserta atribut, fungsi CRUD, dan relasi ke Supabase. |
| 5 | **Rancangan Layar** | 1 | Struktur layout, daftar halaman, komponen UI | Struktur layout global (Root, AppShell, Admin); tabel halaman per route dengan layout dan komponen utama; daftar komponen UI dan perannya. |
| 6 | **Tampilan Layar** | 1 | Mapping tampilan ke file TSX | Mapping tampilan aktual ke file JSX/TSX; elemen utama per halaman (state, form, komponen). |

**Total jenis diagram/dokumen:** 6  
**Total diagram/dokumen detail:** 18 (Use Case 1 + Activity 7 + Sequence 7 + Class 1 + Rancangan 1 + Tampilan 1)

---

*Dokumen ini hanya mendokumentasikan fitur yang ada di codebase. Tidak ada asumsi fitur yang belum diimplementasi.*
