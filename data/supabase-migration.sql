-- Supabase Migration Script
-- Run this in your Supabase SQL Editor to create all required tables

-- ============================================
-- MASTER DATA: Brands
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MASTER DATA: Product Categories
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MASTER DATA: Ingredients (with weight mapping)
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  effect TEXT,
  w_oily REAL DEFAULT 0,
  w_dry REAL DEFAULT 0,
  w_normal REAL DEFAULT 0,
  w_acne REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MASTER DATA: Recommendations (tips per condition)
-- ============================================
CREATE TABLE IF NOT EXISTS recommendations (
  id BIGSERIAL PRIMARY KEY,
  condition TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  tips TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONAL: Products (updated with FKs)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand_id BIGINT REFERENCES brands(id),
  category_id BIGINT REFERENCES product_categories(id),
  description TEXT,
  image_url TEXT,
  w_oily REAL DEFAULT 0,
  w_dry REAL DEFAULT 0,
  w_normal REAL DEFAULT 0,
  w_acne REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JUNCTION: Product Ingredients (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id BIGINT REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, ingredient_id)
);

-- ============================================
-- MASTER DATA: Rules (must be after products)
-- ============================================
CREATE TABLE IF NOT EXISTS rules (
  id BIGSERIAL PRIMARY KEY,
  skin_type_id BIGINT REFERENCES recommendations(id),
  product_id BIGINT REFERENCES products(id),
  confidence_score REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRANSACTIONAL: Analysis Logs
-- ============================================
CREATE TABLE IF NOT EXISTS analysis_logs (
  id BIGSERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTH: Tables (for better-auth)
-- ============================================
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" INTEGER DEFAULT 0,
  image TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
