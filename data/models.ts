import db from './database';

// ============================================
// INTERFACES
// ============================================

export interface Brand {
  id: number;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Ingredient {
  id: number;
  name: string;
  effect: string | null;
  w_oily: number;
  w_dry: number;
  w_normal: number;
  w_acne: number;
  created_at: string;
}

export interface Recommendation {
  id: number;
  condition: string;
  title: string;
  description: string | null;
  tips: string | null; // JSON string array
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  brand_id: number | null;
  category_id: number | null;
  description: string | null;
  image_url: string | null;
  w_oily: number;
  w_dry: number;
  w_normal: number;
  w_acne: number;
  created_at: string;
  // Joined fields
  brand_name?: string;
  category_name?: string;
}

export interface ProductIngredient {
  product_id: number;
  ingredient_id: number;
}

export interface AnalysisLog {
  id: number;
  user_name: string;
  user_email: string | null;
  user_phone: string | null;
  user_age: number;
  oily_score: number;
  dry_score: number;
  normal_score: number;
  acne_score: number;
  dominant_condition: string;
  recommended_product_ids: string;
  created_at: string;
}

// For backward compatibility
export interface SkinType {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

// ============================================
// BRANDS CRUD
// ============================================

export const getAllBrands = (): Brand[] => {
  return db.prepare('SELECT * FROM brands ORDER BY name').all() as Brand[];
};

export const getBrandById = (id: number): Brand | undefined => {
  return db.prepare('SELECT * FROM brands WHERE id = ?').get(id) as Brand | undefined;
};

export const createBrand = (brand: Omit<Brand, 'id' | 'created_at'>): number => {
  const result = db.prepare('INSERT INTO brands (name, logo_url) VALUES (?, ?)')
    .run(brand.name, brand.logo_url || null);
  return result.lastInsertRowid as number;
};

export const updateBrand = (id: number, brand: Partial<Omit<Brand, 'id' | 'created_at'>>): void => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (brand.name !== undefined) { fields.push('name = ?'); values.push(brand.name); }
  if (brand.logo_url !== undefined) { fields.push('logo_url = ?'); values.push(brand.logo_url); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE brands SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

export const deleteBrand = (id: number): void => {
  db.prepare('DELETE FROM brands WHERE id = ?').run(id);
};

// ============================================
// PRODUCT CATEGORIES CRUD
// ============================================

export const getAllCategories = (): ProductCategory[] => {
  return db.prepare('SELECT * FROM product_categories ORDER BY name').all() as ProductCategory[];
};

export const getCategoryById = (id: number): ProductCategory | undefined => {
  return db.prepare('SELECT * FROM product_categories WHERE id = ?').get(id) as ProductCategory | undefined;
};

export const createCategory = (category: Omit<ProductCategory, 'id' | 'created_at'>): number => {
  const result = db.prepare('INSERT INTO product_categories (name, description) VALUES (?, ?)')
    .run(category.name, category.description || null);
  return result.lastInsertRowid as number;
};

export const updateCategory = (id: number, category: Partial<Omit<ProductCategory, 'id' | 'created_at'>>): void => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (category.name !== undefined) { fields.push('name = ?'); values.push(category.name); }
  if (category.description !== undefined) { fields.push('description = ?'); values.push(category.description); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE product_categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

export const deleteCategory = (id: number): void => {
  db.prepare('DELETE FROM product_categories WHERE id = ?').run(id);
};

// ============================================
// INGREDIENTS CRUD
// ============================================

export const getAllIngredients = (): Ingredient[] => {
  return db.prepare('SELECT * FROM ingredients ORDER BY name').all() as Ingredient[];
};

export const getIngredientById = (id: number): Ingredient | undefined => {
  return db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id) as Ingredient | undefined;
};

export const createIngredient = (ingredient: Omit<Ingredient, 'id' | 'created_at'>): number => {
  const result = db.prepare(
    'INSERT INTO ingredients (name, effect, w_oily, w_dry, w_normal, w_acne) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    ingredient.name,
    ingredient.effect || null,
    ingredient.w_oily || 0,
    ingredient.w_dry || 0,
    ingredient.w_normal || 0,
    ingredient.w_acne || 0
  );
  return result.lastInsertRowid as number;
};

export const updateIngredient = (id: number, ingredient: Partial<Omit<Ingredient, 'id' | 'created_at'>>): void => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (ingredient.name !== undefined) { fields.push('name = ?'); values.push(ingredient.name); }
  if (ingredient.effect !== undefined) { fields.push('effect = ?'); values.push(ingredient.effect); }
  if (ingredient.w_oily !== undefined) { fields.push('w_oily = ?'); values.push(ingredient.w_oily); }
  if (ingredient.w_dry !== undefined) { fields.push('w_dry = ?'); values.push(ingredient.w_dry); }
  if (ingredient.w_normal !== undefined) { fields.push('w_normal = ?'); values.push(ingredient.w_normal); }
  if (ingredient.w_acne !== undefined) { fields.push('w_acne = ?'); values.push(ingredient.w_acne); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE ingredients SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

export const deleteIngredient = (id: number): void => {
  db.prepare('DELETE FROM ingredients WHERE id = ?').run(id);
};

// ============================================
// RECOMMENDATIONS CRUD
// ============================================

export const getAllRecommendations = (): Recommendation[] => {
  return db.prepare('SELECT * FROM recommendations ORDER BY condition').all() as Recommendation[];
};

export const getRecommendationById = (id: number): Recommendation | undefined => {
  return db.prepare('SELECT * FROM recommendations WHERE id = ?').get(id) as Recommendation | undefined;
};

export const getRecommendationByCondition = (condition: string): Recommendation | undefined => {
  return db.prepare('SELECT * FROM recommendations WHERE condition = ?').get(condition) as Recommendation | undefined;
};

export const createRecommendation = (rec: Omit<Recommendation, 'id' | 'created_at'>): number => {
  const result = db.prepare(
    'INSERT INTO recommendations (condition, title, description, tips) VALUES (?, ?, ?, ?)'
  ).run(rec.condition, rec.title, rec.description || null, rec.tips || null);
  return result.lastInsertRowid as number;
};

export const updateRecommendation = (id: number, rec: Partial<Omit<Recommendation, 'id' | 'created_at'>>): void => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (rec.condition !== undefined) { fields.push('condition = ?'); values.push(rec.condition); }
  if (rec.title !== undefined) { fields.push('title = ?'); values.push(rec.title); }
  if (rec.description !== undefined) { fields.push('description = ?'); values.push(rec.description); }
  if (rec.tips !== undefined) { fields.push('tips = ?'); values.push(rec.tips); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE recommendations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
};

export const deleteRecommendation = (id: number): void => {
  db.prepare('DELETE FROM recommendations WHERE id = ?').run(id);
};

// ============================================
// PRODUCTS CRUD
// ============================================

export const getAllProducts = (): Product[] => {
  return db.prepare(`
    SELECT p.*, b.name as brand_name, c.name as category_name
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN product_categories c ON p.category_id = c.id
    ORDER BY p.name
  `).all() as Product[];
};

export const getProductById = (id: number): Product | undefined => {
  return db.prepare(`
    SELECT p.*, b.name as brand_name, c.name as category_name
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN product_categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id) as Product | undefined;
};

export const getProductIngredients = (productId: number): Ingredient[] => {
  return db.prepare(`
    SELECT i.* FROM ingredients i
    JOIN product_ingredients pi ON i.id = pi.ingredient_id
    WHERE pi.product_id = ?
    ORDER BY i.name
  `).all(productId) as Ingredient[];
};

export const createProduct = (product: {
  name: string;
  brand_id?: number | null;
  category_id?: number | null;
  description?: string | null;
  image_url?: string | null;
  ingredient_ids?: number[];
}): number => {
  const result = db.prepare(
    'INSERT INTO products (name, brand_id, category_id, description, image_url, w_oily, w_dry, w_normal, w_acne) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0)'
  ).run(
    product.name,
    product.brand_id || null,
    product.category_id || null,
    product.description || null,
    product.image_url || null
  );

  const productId = result.lastInsertRowid as number;

  // Add ingredients and calculate weights
  if (product.ingredient_ids && product.ingredient_ids.length > 0) {
    setProductIngredients(productId, product.ingredient_ids);
  }

  return productId;
};

export const updateProduct = (id: number, product: {
  name?: string;
  brand_id?: number | null;
  category_id?: number | null;
  description?: string | null;
  image_url?: string | null;
  ingredient_ids?: number[];
}): void => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (product.name !== undefined) { fields.push('name = ?'); values.push(product.name); }
  if (product.brand_id !== undefined) { fields.push('brand_id = ?'); values.push(product.brand_id); }
  if (product.category_id !== undefined) { fields.push('category_id = ?'); values.push(product.category_id); }
  if (product.description !== undefined) { fields.push('description = ?'); values.push(product.description); }
  if (product.image_url !== undefined) { fields.push('image_url = ?'); values.push(product.image_url); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  // Update ingredients if provided
  if (product.ingredient_ids !== undefined) {
    setProductIngredients(id, product.ingredient_ids);
  }
};

export const setProductIngredients = (productId: number, ingredientIds: number[]): void => {
  // Clear existing ingredients
  db.prepare('DELETE FROM product_ingredients WHERE product_id = ?').run(productId);

  // Add new ingredients
  const insert = db.prepare('INSERT INTO product_ingredients (product_id, ingredient_id) VALUES (?, ?)');
  let totalOily = 0, totalDry = 0, totalNormal = 0, totalAcne = 0;

  for (const ingredientId of ingredientIds) {
    insert.run(productId, ingredientId);

    const ingredient = getIngredientById(ingredientId);
    if (ingredient) {
      totalOily += ingredient.w_oily;
      totalDry += ingredient.w_dry;
      totalNormal += ingredient.w_normal;
      totalAcne += ingredient.w_acne;
    }
  }

  // Normalize and update product weights
  const max = Math.max(totalOily, totalDry, totalNormal, totalAcne, 1);
  db.prepare('UPDATE products SET w_oily = ?, w_dry = ?, w_normal = ?, w_acne = ? WHERE id = ?').run(
    Math.min(totalOily / max, 1),
    Math.min(totalDry / max, 1),
    Math.min(totalNormal / max, 1),
    Math.min(totalAcne / max, 1),
    productId
  );
};

export const deleteProduct = (id: number): void => {
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
};

// ============================================
// ANALYSIS LOGS CRUD
// ============================================

export const getAllAnalysisLogs = (): AnalysisLog[] => {
  return db.prepare('SELECT * FROM analysis_logs ORDER BY created_at DESC').all() as AnalysisLog[];
};

export const getAnalysisLogById = (id: number): AnalysisLog | undefined => {
  return db.prepare('SELECT * FROM analysis_logs WHERE id = ?').get(id) as AnalysisLog | undefined;
};

export const getAnalysisLogsByDateRange = (startDate: string, endDate: string): AnalysisLog[] => {
  return db.prepare('SELECT * FROM analysis_logs WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC')
    .all(startDate, endDate) as AnalysisLog[];
};

export const getAnalysisLogsByCondition = (condition: string): AnalysisLog[] => {
  return db.prepare('SELECT * FROM analysis_logs WHERE dominant_condition = ? ORDER BY created_at DESC')
    .all(condition) as AnalysisLog[];
};

export const createAnalysisLog = (log: Omit<AnalysisLog, 'id' | 'created_at'>): number => {
  const result = db.prepare(
    'INSERT INTO analysis_logs (user_name, user_email, user_phone, user_age, oily_score, dry_score, normal_score, acne_score, dominant_condition, recommended_product_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    log.user_name,
    log.user_email,
    log.user_phone,
    log.user_age,
    log.oily_score,
    log.dry_score,
    log.normal_score,
    log.acne_score,
    log.dominant_condition,
    log.recommended_product_ids
  );
  return result.lastInsertRowid as number;
};

export const deleteAnalysisLog = (id: number): void => {
  db.prepare('DELETE FROM analysis_logs WHERE id = ?').run(id);
};

// ============================================
// LEGACY: Skin Types (backward compatibility)
// ============================================

export const getAllSkinTypes = (): SkinType[] => {
  // Return recommendations as skin types for backward compatibility
  const recs = getAllRecommendations();
  return recs.map(r => ({
    id: r.id,
    name: r.condition,
    description: r.description,
    created_at: r.created_at
  }));
};

export const getSkinTypeById = (id: number): SkinType | undefined => {
  const rec = getRecommendationById(id);
  if (!rec) return undefined;
  return { id: rec.id, name: rec.condition, description: rec.description, created_at: rec.created_at };
};

export const createSkinType = (skinType: Omit<SkinType, 'id' | 'created_at'>): number => {
  return createRecommendation({
    condition: skinType.name,
    title: skinType.name,
    description: skinType.description,
    tips: null
  });
};

export const updateSkinType = (id: number, skinType: Partial<Omit<SkinType, 'id' | 'created_at'>>): void => {
  updateRecommendation(id, {
    condition: skinType.name,
    description: skinType.description
  });
};

export const deleteSkinType = (id: number): void => {
  deleteRecommendation(id);
};

// ============================================
// WEIGHT CALCULATION (from DB ingredients)
// ============================================

export const calculateWeights = (ingredientIds: number[]): { w_oily: number; w_dry: number; w_normal: number; w_acne: number } => {
  let oily = 0, dry = 0, normal = 0, acne = 0;

  for (const id of ingredientIds) {
    const ingredient = getIngredientById(id);
    if (ingredient) {
      oily += ingredient.w_oily;
      dry += ingredient.w_dry;
      normal += ingredient.w_normal;
      acne += ingredient.w_acne;
    }
  }

  const max = Math.max(oily, dry, normal, acne, 1);
  return {
    w_oily: Math.min(oily / max, 1),
    w_dry: Math.min(dry / max, 1),
    w_normal: Math.min(normal / max, 1),
    w_acne: Math.min(acne / max, 1),
  };
};