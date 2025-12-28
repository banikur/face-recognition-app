/**
 * Database Migration & Seed Script
 * 
 * Tables:
 * - Master Data: brands, product_categories, ingredients, recommendations
 * - Transactional: products, product_ingredients, analysis_logs
 * - Auth: user, session, account, verification
 * 
 * Usage: npm run init-db
 */

import Database from 'better-sqlite3';
import { scryptSync, randomBytes } from 'crypto';

const db = new Database('./data/database.db');

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

console.log('🔧 Initializing database...\n');

// ============================================
// MASTER DATA: Brands
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✓ Brands table ready');

// ============================================
// MASTER DATA: Product Categories
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✓ Product categories table ready');

// ============================================
// MASTER DATA: Ingredients (with weight mapping)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    effect TEXT,
    w_oily REAL DEFAULT 0,
    w_dry REAL DEFAULT 0,
    w_normal REAL DEFAULT 0,
    w_acne REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✓ Ingredients table ready');

// ============================================
// MASTER DATA: Recommendations (tips per condition)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    condition TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    tips TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✓ Recommendations table ready');

// ============================================
// TRANSACTIONAL: Products (updated with FKs)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand_id INTEGER REFERENCES brands(id),
    category_id INTEGER REFERENCES product_categories(id),
    description TEXT,
    image_url TEXT,
    w_oily REAL DEFAULT 0,
    w_dry REAL DEFAULT 0,
    w_normal REAL DEFAULT 0,
    w_acne REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✓ Products table ready');

// ============================================
// JUNCTION: Product Ingredients (many-to-many)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS product_ingredients (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, ingredient_id)
  );
`);
console.log('✓ Product ingredients junction table ready');

// ============================================
// TRANSACTIONAL: Analysis Logs
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    user_email TEXT,
    user_phone TEXT,
    user_age INTEGER,
    oily_score REAL NOT NULL,
    dry_score REAL NOT NULL,
    normal_score REAL NOT NULL,
    acne_score REAL NOT NULL,
    dominant_condition TEXT NOT NULL,
    recommended_product_ids TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✓ Analysis logs table ready');

// ============================================
// AUTH: Tables (for better-auth)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER DEFAULT 0,
    image TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt DATETIME NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt DATETIME,
    refreshTokenExpiresAt DATETIME,
    scope TEXT,
    password TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✓ Auth tables ready');

// ============================================
// SEED: Admin User
// ============================================
const adminEmail = 'admin@skinlab.com';
const adminPassword = 'admin123';

const existingAdmin = db.prepare('SELECT id FROM user WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
  const userId = randomBytes(16).toString('hex');
  const accountId = randomBytes(16).toString('hex');
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(adminPassword, salt, 64).toString('hex');
  const hashedPassword = `${salt}:${hash}`;

  db.prepare('INSERT INTO user (id, name, email, emailVerified) VALUES (?, ?, ?, 1)')
    .run(userId, 'Admin', adminEmail);
  db.prepare('INSERT INTO account (id, accountId, providerId, userId, password) VALUES (?, ?, \'credential\', ?, ?)')
    .run(accountId, accountId, userId, hashedPassword);

  console.log('✓ Admin user created');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
} else {
  console.log('✓ Admin user already exists');
}

// ============================================
// SEED: Brands
// ============================================
const brands = [
  { name: 'CeraVe', logo_url: null },
  { name: 'Cetaphil', logo_url: null },
  { name: 'Neutrogena', logo_url: null },
  { name: 'Nivea', logo_url: null },
  { name: 'The Body Shop', logo_url: null },
  { name: 'La Roche-Posay', logo_url: null },
];

const brandCount = db.prepare('SELECT COUNT(*) as count FROM brands').get() as { count: number };
if (brandCount.count === 0) {
  const insertBrand = db.prepare('INSERT INTO brands (name, logo_url) VALUES (?, ?)');
  for (const b of brands) {
    insertBrand.run(b.name, b.logo_url);
  }
  console.log(`✓ Seeded ${brands.length} brands`);
} else {
  console.log(`✓ Brands already seeded (${brandCount.count} existing)`);
}

// ============================================
// SEED: Product Categories
// ============================================
const categories = [
  { name: 'Cleanser', description: 'Face wash and cleansing products' },
  { name: 'Moisturizer', description: 'Hydrating and moisturizing products' },
  { name: 'Serum', description: 'Concentrated treatment products' },
  { name: 'Toner', description: 'Balancing and prep products' },
  { name: 'Sunscreen', description: 'Sun protection products' },
];

const categoryCount = db.prepare('SELECT COUNT(*) as count FROM product_categories').get() as { count: number };
if (categoryCount.count === 0) {
  const insertCategory = db.prepare('INSERT INTO product_categories (name, description) VALUES (?, ?)');
  for (const c of categories) {
    insertCategory.run(c.name, c.description);
  }
  console.log(`✓ Seeded ${categories.length} categories`);
} else {
  console.log(`✓ Categories already seeded (${categoryCount.count} existing)`);
}

// ============================================
// SEED: Ingredients (migrated from hardcode)
// ============================================
const ingredients = [
  { name: 'Salicylic Acid', effect: 'Oil control, acne treatment', w_oily: 0.5, w_dry: 0, w_normal: 0, w_acne: 0.5 },
  { name: 'Charcoal', effect: 'Deep cleansing, oil absorption', w_oily: 0.5, w_dry: 0, w_normal: 0, w_acne: 0.5 },
  { name: 'Tea Tree', effect: 'Antibacterial, acne treatment', w_oily: 0.5, w_dry: 0, w_normal: 0, w_acne: 0.5 },
  { name: 'Aloe Vera', effect: 'Soothing, hydrating', w_oily: 0, w_dry: 0.5, w_normal: 0.3, w_acne: 0 },
  { name: 'Glycerin', effect: 'Moisturizing, humectant', w_oily: 0, w_dry: 0.5, w_normal: 0.3, w_acne: 0 },
  { name: 'Hyaluronic Acid', effect: 'Deep hydration', w_oily: 0, w_dry: 0.5, w_normal: 0.3, w_acne: 0 },
  { name: 'Niacinamide', effect: 'Pore minimizing, brightening', w_oily: 0.3, w_dry: 0, w_normal: 0.2, w_acne: 0.3 },
  { name: 'Menthol', effect: 'Cooling, refreshing', w_oily: 0.4, w_dry: 0, w_normal: 0, w_acne: 0 },
  { name: 'Ceramide', effect: 'Barrier repair, moisture lock', w_oily: 0, w_dry: 0.5, w_normal: 0, w_acne: 0 },
  { name: 'Benzoyl Peroxide', effect: 'Acne treatment, antibacterial', w_oily: 0.4, w_dry: 0, w_normal: 0, w_acne: 0.6 },
  { name: 'Retinol', effect: 'Anti-aging, cell turnover', w_oily: 0.3, w_dry: 0, w_normal: 0.2, w_acne: 0.4 },
  { name: 'Vitamin C', effect: 'Brightening, antioxidant', w_oily: 0, w_dry: 0.2, w_normal: 0.3, w_acne: 0 },
  { name: 'Witch Hazel', effect: 'Astringent, pore tightening', w_oily: 0.4, w_dry: 0, w_normal: 0, w_acne: 0.3 },
  { name: 'Sulfur', effect: 'Acne treatment, oil control', w_oily: 0.4, w_dry: 0, w_normal: 0, w_acne: 0.5 },
];

const ingredientCount = db.prepare('SELECT COUNT(*) as count FROM ingredients').get() as { count: number };
if (ingredientCount.count === 0) {
  const insertIngredient = db.prepare('INSERT INTO ingredients (name, effect, w_oily, w_dry, w_normal, w_acne) VALUES (?, ?, ?, ?, ?, ?)');
  for (const i of ingredients) {
    insertIngredient.run(i.name, i.effect, i.w_oily, i.w_dry, i.w_normal, i.w_acne);
  }
  console.log(`✓ Seeded ${ingredients.length} ingredients`);
} else {
  console.log(`✓ Ingredients already seeded (${ingredientCount.count} existing)`);
}

// ============================================
// SEED: Recommendations (tips per condition)
// ============================================
const recommendations = [
  {
    condition: 'oily',
    title: 'Kulit Berminyak',
    description: 'Kulit Anda memproduksi sebum berlebih',
    tips: JSON.stringify([
      'Gunakan cleanser berbahan Salicylic Acid',
      'Pilih moisturizer oil-free',
      'Gunakan sunscreen non-comedogenic',
      'Hindari produk berbahan minyak'
    ])
  },
  {
    condition: 'dry',
    title: 'Kulit Kering',
    description: 'Kulit Anda membutuhkan hidrasi ekstra',
    tips: JSON.stringify([
      'Gunakan cleanser lembut tanpa sulfat',
      'Pilih moisturizer dengan Hyaluronic Acid',
      'Aplikasikan moisturizer saat kulit masih lembab',
      'Hindari air panas saat mencuci muka'
    ])
  },
  {
    condition: 'normal',
    title: 'Kulit Normal',
    description: 'Kulit Anda seimbang dan sehat',
    tips: JSON.stringify([
      'Pertahankan rutinitas skincare yang simpel',
      'Gunakan sunscreen setiap hari',
      'Pilih produk dengan Vitamin C untuk menjaga kecerahan',
      'Tetap hidrasi dengan minum air yang cukup'
    ])
  },
  {
    condition: 'acne',
    title: 'Kulit Berjerawat',
    description: 'Kulit Anda rentan terhadap jerawat',
    tips: JSON.stringify([
      'Gunakan produk dengan Benzoyl Peroxide atau Salicylic Acid',
      'Jangan memencet jerawat',
      'Ganti sarung bantal secara rutin',
      'Hindari menyentuh wajah dengan tangan'
    ])
  },
];

const recsCount = db.prepare('SELECT COUNT(*) as count FROM recommendations').get() as { count: number };
if (recsCount.count === 0) {
  const insertRec = db.prepare('INSERT INTO recommendations (condition, title, description, tips) VALUES (?, ?, ?, ?)');
  for (const r of recommendations) {
    insertRec.run(r.condition, r.title, r.description, r.tips);
  }
  console.log(`✓ Seeded ${recommendations.length} recommendations`);
} else {
  console.log(`✓ Recommendations already seeded (${recsCount.count} existing)`);
}

// ============================================
// SEED: Sample Products
// ============================================
const products = [
  { name: 'Deep Cleansing Foam', brand: 'CeraVe', category: 'Cleanser', description: 'Pembersih wajah dengan salicylic acid untuk kulit berminyak dan berjerawat', ingredients: [1, 7] }, // Salicylic Acid, Niacinamide
  { name: 'Hydrating Cleanser', brand: 'CeraVe', category: 'Cleanser', description: 'Pembersih lembut untuk kulit kering dan sensitif', ingredients: [6, 9, 5] }, // Hyaluronic, Ceramide, Glycerin
  { name: 'Tea Tree Face Wash', brand: 'The Body Shop', category: 'Cleanser', description: 'Pembersih wajah tea tree untuk kulit bermasalah', ingredients: [3, 1, 4] }, // Tea Tree, Salicylic, Aloe
  { name: 'Gentle Skin Cleanser', brand: 'Cetaphil', category: 'Cleanser', description: 'Pembersih wajah lembut untuk semua jenis kulit', ingredients: [5, 7] }, // Glycerin, Niacinamide
  { name: 'Acne Control Wash', brand: 'Neutrogena', category: 'Cleanser', description: 'Pembersih dengan benzoyl peroxide untuk jerawat', ingredients: [10, 1, 13] }, // Benzoyl, Salicylic, Witch Hazel
  { name: 'Oil Control Foam', brand: 'Nivea', category: 'Cleanser', description: 'Pembersih foam untuk mengontrol minyak berlebih', ingredients: [2, 8, 1, 7] }, // Charcoal, Menthol, Salicylic, Niacinamide
];

const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (productCount.count === 0) {
  const getBrandId = db.prepare('SELECT id FROM brands WHERE name = ?');
  const getCategoryId = db.prepare('SELECT id FROM product_categories WHERE name = ?');
  const insertProduct = db.prepare('INSERT INTO products (name, brand_id, category_id, description, w_oily, w_dry, w_normal, w_acne) VALUES (?, ?, ?, ?, 0, 0, 0, 0)');
  const insertProductIngredient = db.prepare('INSERT INTO product_ingredients (product_id, ingredient_id) VALUES (?, ?)');
  const getIngredientWeights = db.prepare('SELECT w_oily, w_dry, w_normal, w_acne FROM ingredients WHERE id = ?');
  const updateProductWeights = db.prepare('UPDATE products SET w_oily = ?, w_dry = ?, w_normal = ?, w_acne = ? WHERE id = ?');

  for (const p of products) {
    const brand = getBrandId.get(p.brand) as { id: number } | undefined;
    const category = getCategoryId.get(p.category) as { id: number } | undefined;

    const result = insertProduct.run(
      p.name,
      brand?.id || null,
      category?.id || null,
      p.description
    );

    const productId = result.lastInsertRowid as number;

    // Add ingredients and calculate weights
    let totalOily = 0, totalDry = 0, totalNormal = 0, totalAcne = 0;

    for (const ingredientId of p.ingredients) {
      insertProductIngredient.run(productId, ingredientId);

      const weights = getIngredientWeights.get(ingredientId) as { w_oily: number; w_dry: number; w_normal: number; w_acne: number } | undefined;
      if (weights) {
        totalOily += weights.w_oily;
        totalDry += weights.w_dry;
        totalNormal += weights.w_normal;
        totalAcne += weights.w_acne;
      }
    }

    // Normalize weights
    const max = Math.max(totalOily, totalDry, totalNormal, totalAcne, 1);
    updateProductWeights.run(
      Math.min(totalOily / max, 1),
      Math.min(totalDry / max, 1),
      Math.min(totalNormal / max, 1),
      Math.min(totalAcne / max, 1),
      productId
    );
  }
  console.log(`✓ Seeded ${products.length} products with ingredients`);
} else {
  console.log(`✓ Products already seeded (${productCount.count} existing)`);
}

console.log('\n✅ Database initialization complete!');
console.log('   Location: ./data/database.db\n');