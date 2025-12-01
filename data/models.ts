import db from './database';

// Auto Weight Mapping - Keyword to skin condition weights
const INGREDIENT_WEIGHTS: Record<string, { oily: number; dry: number; normal: number; acne: number }> = {
  'salicylic acid': { oily: 0.5, dry: 0, normal: 0, acne: 0.5 },
  'charcoal': { oily: 0.5, dry: 0, normal: 0, acne: 0.5 },
  'tea tree': { oily: 0.5, dry: 0, normal: 0, acne: 0.5 },
  'aloe vera': { oily: 0, dry: 0.5, normal: 0.3, acne: 0 },
  'glycerin': { oily: 0, dry: 0.5, normal: 0.3, acne: 0 },
  'hyaluronic': { oily: 0, dry: 0.5, normal: 0.3, acne: 0 },
  'niacinamide': { oily: 0.3, dry: 0, normal: 0.2, acne: 0.3 },
  'menthol': { oily: 0.4, dry: 0, normal: 0, acne: 0 },
  'ceramide': { oily: 0, dry: 0.5, normal: 0, acne: 0 },
  'benzoyl peroxide': { oily: 0.4, dry: 0, normal: 0, acne: 0.6 },
  'retinol': { oily: 0.3, dry: 0, normal: 0.2, acne: 0.4 },
  'vitamin c': { oily: 0, dry: 0.2, normal: 0.3, acne: 0 },
  'witch hazel': { oily: 0.4, dry: 0, normal: 0, acne: 0.3 },
  'sulfur': { oily: 0.4, dry: 0, normal: 0, acne: 0.5 },
};

// Calculate weights from ingredients
export const calculateWeights = (ingredients: string): { w_oily: number; w_dry: number; w_normal: number; w_acne: number } => {
  const lowerIngredients = ingredients.toLowerCase();
  let oily = 0, dry = 0, normal = 0, acne = 0;

  for (const [keyword, weights] of Object.entries(INGREDIENT_WEIGHTS)) {
    if (lowerIngredients.includes(keyword)) {
      oily += weights.oily;
      dry += weights.dry;
      normal += weights.normal;
      acne += weights.acne;
    }
  }

  // Normalize to [0, 1]
  const max = Math.max(oily, dry, normal, acne, 1);
  return {
    w_oily: Math.min(oily / max, 1),
    w_dry: Math.min(dry / max, 1),
    w_normal: Math.min(normal / max, 1),
    w_acne: Math.min(acne / max, 1),
  };
};

// Product Model
export interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  ingredients: string;
  image_url: string;
  w_oily: number;
  w_dry: number;
  w_normal: number;
  w_acne: number;
  created_at: string;
}

export const getAllProducts = (): Product[] => {
  const stmt = db.prepare('SELECT * FROM products');
  return stmt.all() as Product[];
};

export const getProductById = (id: number): Product | undefined => {
  const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
  return stmt.get(id) as Product | undefined;
};

export const createProduct = (product: Omit<Product, 'id' | 'w_oily' | 'w_dry' | 'w_normal' | 'w_acne' | 'created_at'>): number => {
  const weights = calculateWeights(product.ingredients);
  const stmt = db.prepare(
    'INSERT INTO products (name, brand, description, ingredients, image_url, w_oily, w_dry, w_normal, w_acne) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    product.name,
    product.brand,
    product.description,
    product.ingredients,
    product.image_url,
    weights.w_oily,
    weights.w_dry,
    weights.w_normal,
    weights.w_acne
  );
  return result.lastInsertRowid as number;
};

export const updateProduct = (id: number, product: Partial<Omit<Product, 'id' | 'created_at'>>): void => {
  const fields = [];
  const values = [];

  if (product.name !== undefined) {
    fields.push('name = ?');
    values.push(product.name);
  }

  if (product.brand !== undefined) {
    fields.push('brand = ?');
    values.push(product.brand);
  }

  if (product.description !== undefined) {
    fields.push('description = ?');
    values.push(product.description);
  }

  if (product.image_url !== undefined) {
    fields.push('image_url = ?');
    values.push(product.image_url);
  }

  if (product.ingredients !== undefined) {
    fields.push('ingredients = ?');
    values.push(product.ingredients);
    
    // Recalculate weights when ingredients change
    const weights = calculateWeights(product.ingredients);
    fields.push('w_oily = ?', 'w_dry = ?', 'w_normal = ?', 'w_acne = ?');
    values.push(weights.w_oily, weights.w_dry, weights.w_normal, weights.w_acne);
  }

  if (fields.length === 0) return;

  values.push(id);
  const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
};

export const deleteProduct = (id: number): void => {
  const stmt = db.prepare('DELETE FROM products WHERE id = ?');
  stmt.run(id);
};

// Analysis Log Model
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

export const getAllAnalysisLogs = (): AnalysisLog[] => {
  const stmt = db.prepare('SELECT * FROM analysis_logs ORDER BY created_at DESC');
  return stmt.all() as AnalysisLog[];
};

export const getAnalysisLogById = (id: number): AnalysisLog | undefined => {
  const stmt = db.prepare('SELECT * FROM analysis_logs WHERE id = ?');
  return stmt.get(id) as AnalysisLog | undefined;
};

export const getAnalysisLogsByDateRange = (startDate: string, endDate: string): AnalysisLog[] => {
  const stmt = db.prepare('SELECT * FROM analysis_logs WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC');
  return stmt.all(startDate, endDate) as AnalysisLog[];
};

export const getAnalysisLogsByCondition = (condition: string): AnalysisLog[] => {
  const stmt = db.prepare('SELECT * FROM analysis_logs WHERE dominant_condition = ? ORDER BY created_at DESC');
  return stmt.all(condition) as AnalysisLog[];
};

export const createAnalysisLog = (log: Omit<AnalysisLog, 'id' | 'created_at'>): number => {
  const stmt = db.prepare(
    'INSERT INTO analysis_logs (user_name, user_email, user_phone, user_age, oily_score, dry_score, normal_score, acne_score, dominant_condition, recommended_product_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
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
  const stmt = db.prepare('DELETE FROM analysis_logs WHERE id = ?');
  stmt.run(id);
};

// Skin Type Model
export interface SkinType {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export const getAllSkinTypes = (): SkinType[] => {
  try {
    const stmt = db.prepare('SELECT * FROM skin_types ORDER BY name');
    return stmt.all() as SkinType[];
  } catch (error) {
    console.error('Error fetching skin types:', error);
    return [];
  }
};

export const getSkinTypeById = (id: number): SkinType | undefined => {
  try {
    const stmt = db.prepare('SELECT * FROM skin_types WHERE id = ?');
    return stmt.get(id) as SkinType | undefined;
  } catch (error) {
    console.error('Error fetching skin type:', error);
    return undefined;
  }
};

export const createSkinType = (skinType: Omit<SkinType, 'id' | 'created_at'>): number => {
  try {
    const stmt = db.prepare(
      'INSERT INTO skin_types (name, description) VALUES (?, ?)'
    );
    const result = stmt.run(skinType.name, skinType.description || null);
    return result.lastInsertRowid as number;
  } catch (error) {
    console.error('Error creating skin type:', error);
    throw new Error('Failed to create skin type');
  }
};

export const updateSkinType = (id: number, skinType: Partial<Omit<SkinType, 'id' | 'created_at'>>): void => {
  try {
    const fields = [];
    const values = [];

    if (skinType.name !== undefined) {
      fields.push('name = ?');
      values.push(skinType.name);
    }

    if (skinType.description !== undefined) {
      fields.push('description = ?');
      values.push(skinType.description);
    }

    if (fields.length > 0) {
      const stmt = db.prepare(`UPDATE skin_types SET ${fields.join(', ')} WHERE id = ?`);
      values.push(id);
      stmt.run(...values);
    }
  } catch (error) {
    console.error('Error updating skin type:', error);
    throw new Error('Failed to update skin type');
  }
};

export const deleteSkinType = (id: number): void => {
  try {
    const stmt = db.prepare('DELETE FROM skin_types WHERE id = ?');
    stmt.run(id);
  } catch (error) {
    console.error('Error deleting skin type:', error);
    throw new Error('Failed to delete skin type');
  }
};