-- ============================================
-- FULL SETUP: Migrasi + Seed
-- Jalankan di pgAdmin, DBeaver, Supabase SQL Editor, atau psql
-- ============================================

-- ==================== MIGRASI ====================

CREATE TABLE IF NOT EXISTS brands (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS recommendations (
  id BIGSERIAL PRIMARY KEY,
  condition TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  tips TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id BIGINT REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS rules (
  id BIGSERIAL PRIMARY KEY,
  skin_type_id BIGINT REFERENCES recommendations(id),
  product_id BIGINT REFERENCES products(id),
  confidence_score REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Admin login (simple: email + bcrypt password)
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SEED (skip jika data sudah ada) ====================

INSERT INTO recommendations (condition, title, description, tips)
SELECT * FROM (VALUES
  ('Oily', 'Oily', 'Skin that produces excess sebum', NULL::TEXT),
  ('Dry', 'Dry', 'Skin that lacks moisture and oil', NULL),
  ('Normal', 'Normal', 'Balanced skin with adequate moisture and oil', NULL),
  ('Combination', 'Combination', 'Skin with both oily and dry areas', NULL),
  ('Acne-prone', 'Acne-prone', 'Skin that is susceptible to breakouts and pimples', NULL)
) AS v(condition, title, description, tips)
ON CONFLICT (condition) DO NOTHING;

INSERT INTO ingredients (name, effect, w_oily, w_dry, w_normal, w_acne)
SELECT * FROM (VALUES
  ('Salicylic Acid', 'Exfoliates and unclogs pores', 0, 0, 0, 0),
  ('Tea Tree Oil', 'Natural antibacterial agent', 0, 0, 0, 0),
  ('Hyaluronic Acid', 'Intense hydration', 0, 0, 0, 0),
  ('Glycerin', 'Moisture retention', 0, 0, 0, 0),
  ('Aloe Vera', 'Soothing and calming', 0, 0, 0, 0),
  ('Chamomile', 'Anti-inflammatory properties', 0, 0, 0, 0),
  ('Niacinamide', 'Reduces sebum production', 0, 0, 0, 0),
  ('Ceramides', 'Strengthens skin barrier', 0, 0, 0, 0),
  ('Benzoyl Peroxide', 'Kills acne-causing bacteria', 0, 0, 0, 0)
) AS v(name, effect, w_oily, w_dry, w_normal, w_acne)
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, brand_id, category_id, description, image_url, w_oily, w_dry, w_normal, w_acne)
SELECT * FROM (VALUES
  ('Oil Control Face Wash', NULL::BIGINT, NULL::BIGINT, 'Controls excess oil and prevents breakouts', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL),
  ('Hydrating Face Wash', NULL::BIGINT, NULL::BIGINT, 'Gentle cleanser that hydrates while cleaning', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL),
  ('Balancing Face Wash', NULL::BIGINT, NULL::BIGINT, 'Maintains skin''s natural balance', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL),
  ('Dual Action Cleanser', NULL::BIGINT, NULL::BIGINT, 'Targets both oily and dry areas', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL),
  ('Anti-Acne Face Wash', NULL::BIGINT, NULL::BIGINT, 'Treats and prevents acne breakouts', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL)
) AS v(name, brand_id, category_id, description, image_url, w_oily, w_dry, w_normal, w_acne)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

INSERT INTO rules (skin_type_id, product_id, confidence_score)
SELECT r.id, p.id, CASE r.condition WHEN 'Combination' THEN 0.90 ELSE 0.95 END
FROM recommendations r
JOIN products p ON (
  (r.condition = 'Oily' AND p.name = 'Oil Control Face Wash') OR
  (r.condition = 'Dry' AND p.name = 'Hydrating Face Wash') OR
  (r.condition = 'Normal' AND p.name = 'Balancing Face Wash') OR
  (r.condition = 'Combination' AND p.name = 'Dual Action Cleanser') OR
  (r.condition = 'Acne-prone' AND p.name = 'Anti-Acne Face Wash')
)
WHERE NOT EXISTS (SELECT 1 FROM rules LIMIT 1);

INSERT INTO analysis_logs (user_name, user_email, user_phone, user_age, oily_score, dry_score, normal_score, acne_score, dominant_condition, recommended_product_ids)
SELECT * FROM (VALUES
  ('Sample User 1', NULL, NULL, 25, 0.8, 0.2, 0.1, 0.3, 'Oily', '1'),
  ('Sample User 2', NULL, NULL, 30, 0.1, 0.9, 0.2, 0.1, 'Dry', '2'),
  ('Sample User 3', NULL, NULL, 28, 0.3, 0.3, 0.7, 0.2, 'Normal', '3'),
  ('Sample User 4', NULL, NULL, 32, 0.5, 0.4, 0.3, 0.2, 'Combination', '4'),
  ('Sample User 5', NULL, NULL, 22, 0.6, 0.2, 0.1, 0.8, 'Acne-prone', '5')
) AS v(user_name, user_email, user_phone, user_age, oily_score, dry_score, normal_score, acne_score, dominant_condition, recommended_product_ids)
WHERE NOT EXISTS (SELECT 1 FROM analysis_logs LIMIT 1);

-- Admin (email: admin@skinlab.com, password: admin123)
INSERT INTO admin_users (email, password_hash)
SELECT 'admin@skinlab.com', '$2b$10$JunYk0VKbLJ0ftAcqcVxsO3YdGh7vWFOcu9LCyVsyqshHRBFDy.Wq'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@skinlab.com');
