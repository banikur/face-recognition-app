/**
 * Database Migration & Seed Script
 * 
 * Combines all tables (products, analysis_logs, auth) into one database
 * and seeds initial admin user + sample products
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
// SCHEMA: Products Table
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL,
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
// SCHEMA: Analysis Logs Table
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
// SCHEMA: Auth Tables (for better-auth)
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

// Check if admin exists
const existingAdmin = db.prepare('SELECT id FROM user WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
    const userId = randomBytes(16).toString('hex');
    const accountId = randomBytes(16).toString('hex');

    // Hash password (using scrypt like better-auth)
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(adminPassword, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;

    // Insert user
    db.prepare(`
    INSERT INTO user (id, name, email, emailVerified)
    VALUES (?, ?, ?, 1)
  `).run(userId, 'Admin', adminEmail);

    // Insert account with password
    db.prepare(`
    INSERT INTO account (id, accountId, providerId, userId, password)
    VALUES (?, ?, 'credential', ?, ?)
  `).run(accountId, accountId, userId, hashedPassword);

    console.log('✓ Admin user created');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
} else {
    console.log('✓ Admin user already exists');
}

// ============================================
// SEED: Sample Products
// ============================================
const products = [
    {
        name: 'Deep Cleansing Foam',
        brand: 'CeraVe',
        description: 'Pembersih wajah dengan salicylic acid untuk kulit berminyak dan berjerawat',
        ingredients: 'Salicylic Acid, Niacinamide, Ceramides, Glycerin',
        w_oily: 0.8, w_dry: 0.1, w_normal: 0.3, w_acne: 0.9
    },
    {
        name: 'Hydrating Cleanser',
        brand: 'CeraVe',
        description: 'Pembersih lembut untuk kulit kering dan sensitif',
        ingredients: 'Hyaluronic Acid, Ceramides, Glycerin, Vitamin E',
        w_oily: 0.1, w_dry: 0.9, w_normal: 0.5, w_acne: 0.1
    },
    {
        name: 'Tea Tree Face Wash',
        brand: 'The Body Shop',
        description: 'Pembersih wajah tea tree untuk kulit bermasalah',
        ingredients: 'Tea Tree Oil, Salicylic Acid, Aloe Vera',
        w_oily: 0.7, w_dry: 0.1, w_normal: 0.2, w_acne: 0.8
    },
    {
        name: 'Gentle Skin Cleanser',
        brand: 'Cetaphil',
        description: 'Pembersih wajah lembut untuk semua jenis kulit',
        ingredients: 'Glycerin, Panthenol, Niacinamide',
        w_oily: 0.3, w_dry: 0.5, w_normal: 0.9, w_acne: 0.2
    },
    {
        name: 'Acne Control Wash',
        brand: 'Neutrogena',
        description: 'Pembersih dengan benzoyl peroxide untuk jerawat',
        ingredients: 'Benzoyl Peroxide 2.5%, Salicylic Acid, Witch Hazel',
        w_oily: 0.6, w_dry: 0.0, w_normal: 0.1, w_acne: 1.0
    },
    {
        name: 'Oil Control Foam',
        brand: 'Nivea',
        description: 'Pembersih foam untuk mengontrol minyak berlebih',
        ingredients: 'Charcoal, Menthol, Salicylic Acid, Niacinamide',
        w_oily: 0.9, w_dry: 0.0, w_normal: 0.2, w_acne: 0.5
    }
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (name, brand, description, ingredients, w_oily, w_dry, w_normal, w_acne)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// Check if products exist
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };

if (productCount.count === 0) {
    for (const p of products) {
        insertProduct.run(p.name, p.brand, p.description, p.ingredients, p.w_oily, p.w_dry, p.w_normal, p.w_acne);
    }
    console.log(`✓ Seeded ${products.length} products`);
} else {
    console.log(`✓ Products already seeded (${productCount.count} existing)`);
}

console.log('\n✅ Database initialization complete!');
console.log('   Location: ./data/database.db\n');