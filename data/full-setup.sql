-- ============================================
-- FULL SETUP: Migrasi + Seed (database kosong)
-- 6 Kategori CNN: acne, blackheads, clear_skin, dark_spots, puffy_eyes, wrinkles
-- Ingredients = kunci rule-based recommendation
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
  w_acne REAL DEFAULT 0,
  w_blackheads REAL DEFAULT 0,
  w_clear_skin REAL DEFAULT 0,
  w_dark_spots REAL DEFAULT 0,
  w_puffy_eyes REAL DEFAULT 0,
  w_wrinkles REAL DEFAULT 0,
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
  w_acne REAL DEFAULT 0,
  w_blackheads REAL DEFAULT 0,
  w_clear_skin REAL DEFAULT 0,
  w_dark_spots REAL DEFAULT 0,
  w_puffy_eyes REAL DEFAULT 0,
  w_wrinkles REAL DEFAULT 0,
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
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SEED ====================

INSERT INTO recommendations (condition, title, description, tips)
SELECT * FROM (VALUES
  ('acne', 'Acne', 'Skin with acne breakouts', NULL::TEXT),
  ('blackheads', 'Blackheads', 'Skin with blackheads', NULL),
  ('clear_skin', 'Clear Skin', 'Healthy clear skin', NULL),
  ('dark_spots', 'Dark Spots', 'Skin with hyperpigmentation', NULL),
  ('puffy_eyes', 'Puffy Eyes', 'Skin with puffy eyes area', NULL),
  ('wrinkles', 'Wrinkles', 'Skin with fine lines and wrinkles', NULL)
) AS v(condition, title, description, tips)
ON CONFLICT (condition) DO NOTHING;

INSERT INTO ingredients (name, effect, w_acne, w_blackheads, w_clear_skin, w_dark_spots, w_puffy_eyes, w_wrinkles)
SELECT * FROM (VALUES
  ('Salicylic Acid', 'Exfoliates and unclogs pores', 0.9, 0.8, 0.1, 0.2, 0, 0),
  ('Tea Tree Oil', 'Natural antibacterial', 0.8, 0.6, 0.2, 0, 0, 0),
  ('Hyaluronic Acid', 'Intense hydration', 0, 0, 0.6, 0.3, 0.5, 0.4),
  ('Glycerin', 'Moisture retention', 0, 0, 0.7, 0.4, 0.3, 0.2),
  ('Aloe Vera', 'Soothing and calming', 0.3, 0, 0.7, 0.3, 0.5, 0.2),
  ('Chamomile', 'Anti-inflammatory', 0.2, 0, 0.6, 0.2, 0.6, 0.2),
  ('Niacinamide', 'Reduces sebum', 0.6, 0.7, 0.5, 0.4, 0.2, 0.3),
  ('Ceramides', 'Strengthens skin barrier', 0, 0, 0.6, 0.3, 0.2, 0.5),
  ('Benzoyl Peroxide', 'Kills acne bacteria', 0.95, 0.5, 0, 0, 0, 0),
  ('Retinol', 'Anti-aging, cell turnover', 0.4, 0.3, 0.3, 0.6, 0.2, 0.8),
  ('Vitamin C', 'Brightening, antioxidant', 0.2, 0.2, 0.5, 0.8, 0.3, 0.5)
) AS v(name, effect, w_acne, w_blackheads, w_clear_skin, w_dark_spots, w_puffy_eyes, w_wrinkles)
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (name, brand_id, category_id, description, image_url, w_acne, w_blackheads, w_clear_skin, w_dark_spots, w_puffy_eyes, w_wrinkles)
SELECT * FROM (VALUES
  ('Oil Control Face Wash', NULL::BIGINT, NULL::BIGINT, 'Controls oil and prevents breakouts', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL),
  ('Hydrating Face Wash', NULL::BIGINT, NULL::BIGINT, 'Gentle cleanser that hydrates', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL),
  ('Balancing Face Wash', NULL::BIGINT, NULL::BIGINT, 'Maintains skin balance', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL),
  ('Anti-Acne Face Wash', NULL::BIGINT, NULL::BIGINT, 'Treats and prevents acne', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL),
  ('Brightening Cleanser', NULL::BIGINT, NULL::BIGINT, 'Targets dark spots', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL),
  ('Anti-Aging Face Wash', NULL::BIGINT, NULL::BIGINT, 'Reduces wrinkles', NULL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL, 0::REAL)
) AS v(name, brand_id, category_id, description, image_url, w_acne, w_blackheads, w_clear_skin, w_dark_spots, w_puffy_eyes, w_wrinkles)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

INSERT INTO product_ingredients (product_id, ingredient_id)
SELECT p.id, i.id
FROM products p
CROSS JOIN (VALUES
  ('Oil Control Face Wash', 'Salicylic Acid'),
  ('Oil Control Face Wash', 'Tea Tree Oil'),
  ('Oil Control Face Wash', 'Niacinamide'),
  ('Hydrating Face Wash', 'Hyaluronic Acid'),
  ('Hydrating Face Wash', 'Glycerin'),
  ('Hydrating Face Wash', 'Aloe Vera'),
  ('Hydrating Face Wash', 'Ceramides'),
  ('Balancing Face Wash', 'Glycerin'),
  ('Balancing Face Wash', 'Aloe Vera'),
  ('Balancing Face Wash', 'Chamomile'),
  ('Anti-Acne Face Wash', 'Benzoyl Peroxide'),
  ('Anti-Acne Face Wash', 'Salicylic Acid'),
  ('Anti-Acne Face Wash', 'Tea Tree Oil'),
  ('Brightening Cleanser', 'Vitamin C'),
  ('Brightening Cleanser', 'Niacinamide'),
  ('Brightening Cleanser', 'Aloe Vera'),
  ('Anti-Aging Face Wash', 'Retinol'),
  ('Anti-Aging Face Wash', 'Vitamin C'),
  ('Anti-Aging Face Wash', 'Ceramides')
) AS v(pname, iname)
JOIN ingredients i ON i.name = v.iname
WHERE p.name = v.pname
ON CONFLICT (product_id, ingredient_id) DO NOTHING;

UPDATE products p SET
  w_acne = LEAST(agg.s_acne / NULLIF(agg.mx, 0), 1),
  w_blackheads = LEAST(agg.s_blackheads / NULLIF(agg.mx, 0), 1),
  w_clear_skin = LEAST(agg.s_clear_skin / NULLIF(agg.mx, 0), 1),
  w_dark_spots = LEAST(agg.s_dark_spots / NULLIF(agg.mx, 0), 1),
  w_puffy_eyes = LEAST(agg.s_puffy_eyes / NULLIF(agg.mx, 0), 1),
  w_wrinkles = LEAST(agg.s_wrinkles / NULLIF(agg.mx, 0), 1)
FROM (
  SELECT pi.product_id,
    SUM(i.w_acne) AS s_acne, SUM(i.w_blackheads) AS s_blackheads, SUM(i.w_clear_skin) AS s_clear_skin,
    SUM(i.w_dark_spots) AS s_dark_spots, SUM(i.w_puffy_eyes) AS s_puffy_eyes, SUM(i.w_wrinkles) AS s_wrinkles,
    GREATEST(SUM(i.w_acne), SUM(i.w_blackheads), SUM(i.w_clear_skin), SUM(i.w_dark_spots), SUM(i.w_puffy_eyes), SUM(i.w_wrinkles), 1) AS mx
  FROM product_ingredients pi
  JOIN ingredients i ON i.id = pi.ingredient_id
  GROUP BY pi.product_id
) agg
WHERE p.id = agg.product_id;

-- Auto-populate rules: setiap produk diklasifikasikan ke kondisi berdasarkan weight tertingginya
INSERT INTO rules (skin_type_id, product_id, confidence_score)
SELECT r.id, p.id,
       GREATEST(
         p.w_acne,
         p.w_blackheads,
         p.w_clear_skin,
         p.w_dark_spots,
         p.w_puffy_eyes,
         p.w_wrinkles
       )
FROM products p
JOIN recommendations r
ON r.condition = (
  CASE
    WHEN p.w_acne >= ALL(ARRAY[p.w_blackheads,p.w_clear_skin,p.w_dark_spots,p.w_puffy_eyes,p.w_wrinkles]) THEN 'acne'
    WHEN p.w_blackheads >= ALL(ARRAY[p.w_acne,p.w_clear_skin,p.w_dark_spots,p.w_puffy_eyes,p.w_wrinkles]) THEN 'blackheads'
    WHEN p.w_dark_spots >= ALL(ARRAY[p.w_acne,p.w_blackheads,p.w_clear_skin,p.w_puffy_eyes,p.w_wrinkles]) THEN 'dark_spots'
    WHEN p.w_puffy_eyes >= ALL(ARRAY[p.w_acne,p.w_blackheads,p.w_clear_skin,p.w_dark_spots,p.w_wrinkles]) THEN 'puffy_eyes'
    WHEN p.w_wrinkles >= ALL(ARRAY[p.w_acne,p.w_blackheads,p.w_clear_skin,p.w_dark_spots,p.w_puffy_eyes]) THEN 'wrinkles'
    ELSE 'clear_skin'
  END
)
WHERE NOT EXISTS (SELECT 1 FROM rules LIMIT 1)
ON CONFLICT DO NOTHING;


INSERT INTO analysis_logs (user_name, user_email, user_phone, user_age, acne_score, blackheads_score, clear_skin_score, dark_spots_score, puffy_eyes_score, wrinkles_score, dominant_condition, recommended_product_ids)
SELECT * FROM (VALUES
  ('Guest', NULL, NULL, 0, 0.2, 0.1, 0.8, 0.1, 0.1, 0.1, 'clear_skin', '3'),
  ('Guest', NULL, NULL, 0, 0.85, 0.6, 0.1, 0.2, 0, 0.1, 'acne', '4'),
  ('Guest', NULL, NULL, 0, 0.1, 0.1, 0.2, 0.7, 0.2, 0.3, 'dark_spots', '5')
) AS v(user_name, user_email, user_phone, user_age, acne_score, blackheads_score, clear_skin_score, dark_spots_score, puffy_eyes_score, wrinkles_score, dominant_condition, recommended_product_ids)
WHERE NOT EXISTS (SELECT 1 FROM analysis_logs LIMIT 1);

INSERT INTO admin_users (email, password_hash)
SELECT 'admin@skinlab.com', '$2b$10$JunYk0VKbLJ0ftAcqcVxsO3YdGh7vWFOcu9LCyVsyqshHRBFDy.Wq'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@skinlab.com');

-- ==================== MIGRASI (untuk database existing) ====================

-- Tambah kolom explanation ke tabel rules jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rules' AND column_name = 'explanation'
  ) THEN
    ALTER TABLE rules ADD COLUMN explanation TEXT;
  END IF;
END $$;
