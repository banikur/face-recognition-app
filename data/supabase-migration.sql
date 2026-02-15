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
-- MASTER DATA: Ingredients (6 CNN weights)
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  effect TEXT,
  w_acne REAL DEFAULT 0,
  w_blackheads REAL DEFAULT 0,
  w_clear_skin REAL DEFAULT 0,
  w_dark_spots REAL DEFAULT 0,
  w_puffy_eyes REAL DEFAULT 0,
  w_wrinkles REAL DEFAULT 0,
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
  w_acne REAL DEFAULT 0,
  w_blackheads REAL DEFAULT 0,
  w_clear_skin REAL DEFAULT 0,
  w_dark_spots REAL DEFAULT 0,
  w_puffy_eyes REAL DEFAULT 0,
  w_wrinkles REAL DEFAULT 0,
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
  acne_score REAL NOT NULL,
  blackheads_score REAL NOT NULL,
  clear_skin_score REAL NOT NULL,
  dark_spots_score REAL NOT NULL,
  puffy_eyes_score REAL NOT NULL,
  wrinkles_score REAL NOT NULL,
  dominant_condition TEXT NOT NULL,
  recommended_product_ids TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUTH: Admin login (simple: email + bcrypt)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
