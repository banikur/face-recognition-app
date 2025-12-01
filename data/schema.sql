-- Products Table
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

-- Analysis Logs Table
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