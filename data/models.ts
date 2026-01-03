import { supabase } from '@/lib/supabaseClient';

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

export interface Rule {
  id: number;
  skin_type_id: number;
  product_id: number;
  confidence_score: number;
}

// ============================================
// BRANDS CRUD
// ============================================

export const getAllBrands = async (): Promise<Brand[]> => {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching brands:', error);
    return [];
  }

  return data as Brand[];
};

export const getBrandById = async (id: number): Promise<Brand | undefined> => {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return undefined;
  }

  return data as Brand;
};

export const createBrand = async (brand: Omit<Brand, 'id' | 'created_at'>): Promise<number> => {
  const { data, error } = await supabase
    .from('brands')
    .insert({
      name: brand.name,
      logo_url: brand.logo_url || null
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create brand: ${error?.message || 'Unknown error'}`);
  }

  return data.id;
};

export const updateBrand = async (id: number, brand: Partial<Omit<Brand, 'id' | 'created_at'>>): Promise<void> => {
  const updateData: Partial<Brand> = {};
  if (brand.name !== undefined) updateData.name = brand.name;
  if (brand.logo_url !== undefined) updateData.logo_url = brand.logo_url;

  if (Object.keys(updateData).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('brands')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update brand: ${error.message}`);
  }
};

export const deleteBrand = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('brands')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete brand: ${error.message}`);
  }
};

// ============================================
// PRODUCT CATEGORIES CRUD
// ============================================

export const getAllCategories = async (): Promise<ProductCategory[]> => {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data as ProductCategory[];
};

export const getCategoryById = async (id: number): Promise<ProductCategory | undefined> => {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return undefined;
  }

  return data as ProductCategory;
};

export const createCategory = async (category: Omit<ProductCategory, 'id' | 'created_at'>): Promise<number> => {
  const { data, error } = await supabase
    .from('product_categories')
    .insert({
      name: category.name,
      description: category.description || null
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create category: ${error?.message || 'Unknown error'}`);
  }

  return data.id;
};

export const updateCategory = async (id: number, category: Partial<Omit<ProductCategory, 'id' | 'created_at'>>): Promise<void> => {
  const updateData: Partial<ProductCategory> = {};
  if (category.name !== undefined) updateData.name = category.name;
  if (category.description !== undefined) updateData.description = category.description;

  if (Object.keys(updateData).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('product_categories')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`);
  }
};

export const deleteCategory = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }
};

// ============================================
// INGREDIENTS CRUD
// ============================================

export const getAllIngredients = async (): Promise<Ingredient[]> => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching ingredients:', error);
    return [];
  }

  return data as Ingredient[];
};

export const getIngredientById = async (id: number): Promise<Ingredient | undefined> => {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return undefined;
  }

  return data as Ingredient;
};

export const createIngredient = async (ingredient: Omit<Ingredient, 'id' | 'created_at'>): Promise<number> => {
  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      name: ingredient.name,
      effect: ingredient.effect || null,
      w_oily: ingredient.w_oily || 0,
      w_dry: ingredient.w_dry || 0,
      w_normal: ingredient.w_normal || 0,
      w_acne: ingredient.w_acne || 0
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create ingredient: ${error?.message || 'Unknown error'}`);
  }

  return data.id;
};

export const updateIngredient = async (id: number, ingredient: Partial<Omit<Ingredient, 'id' | 'created_at'>>): Promise<void> => {
  const updateData: Partial<Ingredient> = {};
  if (ingredient.name !== undefined) updateData.name = ingredient.name;
  if (ingredient.effect !== undefined) updateData.effect = ingredient.effect;
  if (ingredient.w_oily !== undefined) updateData.w_oily = ingredient.w_oily;
  if (ingredient.w_dry !== undefined) updateData.w_dry = ingredient.w_dry;
  if (ingredient.w_normal !== undefined) updateData.w_normal = ingredient.w_normal;
  if (ingredient.w_acne !== undefined) updateData.w_acne = ingredient.w_acne;

  if (Object.keys(updateData).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('ingredients')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update ingredient: ${error.message}`);
  }
};

export const deleteIngredient = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete ingredient: ${error.message}`);
  }
};

// ============================================
// RECOMMENDATIONS CRUD
// ============================================

export const getAllRecommendations = async (): Promise<Recommendation[]> => {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .order('condition');

  if (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }

  return data as Recommendation[];
};

export const getRecommendationById = async (id: number): Promise<Recommendation | undefined> => {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return undefined;
  }

  return data as Recommendation;
};

export const getRecommendationByCondition = async (condition: string): Promise<Recommendation | undefined> => {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('condition', condition)
    .single();

  if (error || !data) {
    return undefined;
  }

  return data as Recommendation;
};

export const createRecommendation = async (rec: Omit<Recommendation, 'id' | 'created_at'>): Promise<number> => {
  const { data, error } = await supabase
    .from('recommendations')
    .insert({
      condition: rec.condition,
      title: rec.title,
      description: rec.description || null,
      tips: rec.tips || null
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create recommendation: ${error?.message || 'Unknown error'}`);
  }

  return data.id;
};

export const updateRecommendation = async (id: number, rec: Partial<Omit<Recommendation, 'id' | 'created_at'>>): Promise<void> => {
  const updateData: Partial<Recommendation> = {};
  if (rec.condition !== undefined) updateData.condition = rec.condition;
  if (rec.title !== undefined) updateData.title = rec.title;
  if (rec.description !== undefined) updateData.description = rec.description;
  if (rec.tips !== undefined) updateData.tips = rec.tips;

  if (Object.keys(updateData).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('recommendations')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update recommendation: ${error.message}`);
  }
};

export const deleteRecommendation = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('recommendations')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete recommendation: ${error.message}`);
  }
};

// ============================================
// PRODUCTS CRUD
// ============================================

export const getAllProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      brands:brand_id(name),
      product_categories:category_id(name)
    `)
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Map the joined data to match the Product interface
  return (data || []).map((p: unknown) => {
    const product = p as Product & {
      brands: { name: string } | null;
      product_categories: { name: string } | null;
    };
    return {
      ...product,
      brand_name: product.brands?.name,
      category_name: product.product_categories?.name
    } as Product;
  });
};

export const getProductById = async (id: number): Promise<Product | undefined> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      brands:brand_id(name),
      product_categories:category_id(name)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return undefined;
  }

  const product = data as Product & {
    brands: { name: string } | null;
    product_categories: { name: string } | null;
  };

  return {
    ...product,
    brand_name: product.brands?.name,
    category_name: product.product_categories?.name
  } as Product;
};

export const getProductIngredients = async (productId: number): Promise<Ingredient[]> => {
  const { data, error } = await supabase
    .from('product_ingredients')
    .select(`
      ingredients:ingredient_id(*)
    `)
    .eq('product_id', productId);

  if (error) {
    console.error('Error fetching product ingredients:', error);
    return [];
  }

  // Supabase returns nested structure: { ingredients: Ingredient | Ingredient[] }
  return (data || []).flatMap((pi: { ingredients: Ingredient | Ingredient[] | null }) => {
    if (!pi.ingredients) return [];
    return Array.isArray(pi.ingredients) ? pi.ingredients : [pi.ingredients];
  });
};

export const createProduct = async (product: {
  name: string;
  brand_id?: number | null;
  category_id?: number | null;
  description?: string | null;
  image_url?: string | null;
  ingredient_ids?: number[];
}): Promise<number> => {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: product.name,
      brand_id: product.brand_id || null,
      category_id: product.category_id || null,
      description: product.description || null,
      image_url: product.image_url || null,
      w_oily: 0,
      w_dry: 0,
      w_normal: 0,
      w_acne: 0
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create product: ${error?.message || 'Unknown error'}`);
  }

  const productId = data.id;

  // Add ingredients and calculate weights
  if (product.ingredient_ids && product.ingredient_ids.length > 0) {
    await setProductIngredients(productId, product.ingredient_ids);
  }

  return productId;
};

export const updateProduct = async (id: number, product: {
  name?: string;
  brand_id?: number | null;
  category_id?: number | null;
  description?: string | null;
  image_url?: string | null;
  ingredient_ids?: number[];
}): Promise<void> => {
  const updateData: Partial<Product> = {};
  if (product.name !== undefined) updateData.name = product.name;
  if (product.brand_id !== undefined) updateData.brand_id = product.brand_id;
  if (product.category_id !== undefined) updateData.category_id = product.category_id;
  if (product.description !== undefined) updateData.description = product.description;
  if (product.image_url !== undefined) updateData.image_url = product.image_url;

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  // Update ingredients if provided
  if (product.ingredient_ids !== undefined) {
    await setProductIngredients(id, product.ingredient_ids);
  }
};

export const setProductIngredients = async (productId: number, ingredientIds: number[]): Promise<void> => {
  // Clear existing ingredients
  await supabase
    .from('product_ingredients')
    .delete()
    .eq('product_id', productId);

  // Add new ingredients
  if (ingredientIds.length > 0) {
    const { error: insertError } = await supabase
      .from('product_ingredients')
      .insert(ingredientIds.map(ingredientId => ({
        product_id: productId,
        ingredient_id: ingredientId
      })));

    if (insertError) {
      throw new Error(`Failed to set product ingredients: ${insertError.message}`);
    }
  }

  // Calculate and update product weights
  let totalOily = 0, totalDry = 0, totalNormal = 0, totalAcne = 0;

  for (const ingredientId of ingredientIds) {
    const ingredient = await getIngredientById(ingredientId);
    if (ingredient) {
      totalOily += ingredient.w_oily;
      totalDry += ingredient.w_dry;
      totalNormal += ingredient.w_normal;
      totalAcne += ingredient.w_acne;
    }
  }

  // Normalize and update product weights
  const max = Math.max(totalOily, totalDry, totalNormal, totalAcne, 1);
  const { error: updateError } = await supabase
    .from('products')
    .update({
      w_oily: Math.min(totalOily / max, 1),
      w_dry: Math.min(totalDry / max, 1),
      w_normal: Math.min(totalNormal / max, 1),
      w_acne: Math.min(totalAcne / max, 1)
    })
    .eq('id', productId);

  if (updateError) {
    throw new Error(`Failed to update product weights: ${updateError.message}`);
  }
};

export const deleteProduct = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
};

// ============================================
// ANALYSIS LOGS CRUD
// ============================================

export const getAllAnalysisLogs = async (): Promise<AnalysisLog[]> => {
  const { data, error } = await supabase
    .from('analysis_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching analysis logs:', error);
    return [];
  }

  return data as AnalysisLog[];
};

export const getAnalysisLogById = async (id: number): Promise<AnalysisLog | undefined> => {
  const { data, error } = await supabase
    .from('analysis_logs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return undefined;
  }

  return data as AnalysisLog;
};

export const getAnalysisLogsByDateRange = async (startDate: string, endDate: string): Promise<AnalysisLog[]> => {
  const { data, error } = await supabase
    .from('analysis_logs')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching analysis logs by date range:', error);
    return [];
  }

  return data as AnalysisLog[];
};

export const getAnalysisLogsByCondition = async (condition: string): Promise<AnalysisLog[]> => {
  const { data, error } = await supabase
    .from('analysis_logs')
    .select('*')
    .eq('dominant_condition', condition)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching analysis logs by condition:', error);
    return [];
  }

  return data as AnalysisLog[];
};

export const createAnalysisLog = async (log: Omit<AnalysisLog, 'id' | 'created_at'>): Promise<number> => {
  const { data, error } = await supabase
    .from('analysis_logs')
    .insert({
      user_name: log.user_name,
      user_email: log.user_email,
      user_phone: log.user_phone,
      user_age: log.user_age,
      oily_score: log.oily_score,
      dry_score: log.dry_score,
      normal_score: log.normal_score,
      acne_score: log.acne_score,
      dominant_condition: log.dominant_condition,
      recommended_product_ids: log.recommended_product_ids
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create analysis log: ${error?.message || 'Unknown error'}`);
  }

  return data.id;
};

export const deleteAnalysisLog = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('analysis_logs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete analysis log: ${error.message}`);
  }
};

// ============================================
// LEGACY: Skin Types (backward compatibility)
// ============================================

export const getAllSkinTypes = async (): Promise<SkinType[]> => {
  // Return recommendations as skin types for backward compatibility
  const recs = await getAllRecommendations();
  return recs.map(r => ({
    id: r.id,
    name: r.condition,
    description: r.description,
    created_at: r.created_at
  }));
};

export const getSkinTypeById = async (id: number): Promise<SkinType | undefined> => {
  const rec = await getRecommendationById(id);
  if (!rec) return undefined;
  return { id: rec.id, name: rec.condition, description: rec.description, created_at: rec.created_at };
};

export const createSkinType = async (skinType: Omit<SkinType, 'id' | 'created_at'>): Promise<number> => {
  return createRecommendation({
    condition: skinType.name,
    title: skinType.name,
    description: skinType.description,
    tips: null
  });
};

export const updateSkinType = async (id: number, skinType: Partial<Omit<SkinType, 'id' | 'created_at'>>): Promise<void> => {
  await updateRecommendation(id, {
    condition: skinType.name,
    description: skinType.description
  });
};

export const deleteSkinType = async (id: number): Promise<void> => {
  await deleteRecommendation(id);
};

// ============================================
// WEIGHT CALCULATION (from DB ingredients)
// ============================================

export const calculateWeights = async (ingredientIds: number[]): Promise<{ w_oily: number; w_dry: number; w_normal: number; w_acne: number }> => {
  let oily = 0, dry = 0, normal = 0, acne = 0;

  for (const id of ingredientIds) {
    const ingredient = await getIngredientById(id);
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

// ============================================
// RULES CRUD
// ============================================

export const getAllRules = async (): Promise<Rule[]> => {
  const { data, error } = await supabase
    .from('rules')
    .select('*');

  if (error) {
    console.error('Error fetching rules:', error);
    return [];
  }

  return data as Rule[];
};

export const createRule = async (rule: Omit<Rule, 'id'>): Promise<number> => {
  const { data, error } = await supabase
    .from('rules')
    .insert({
      skin_type_id: rule.skin_type_id,
      product_id: rule.product_id,
      confidence_score: rule.confidence_score
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create rule: ${error?.message || 'Unknown error'}`);
  }

  return data.id;
};

export const updateRule = async (id: number, rule: Partial<Rule>): Promise<void> => {
  const updateData: Partial<Rule> = {};
  if (rule.skin_type_id !== undefined) updateData.skin_type_id = rule.skin_type_id;
  if (rule.product_id !== undefined) updateData.product_id = rule.product_id;
  if (rule.confidence_score !== undefined) updateData.confidence_score = rule.confidence_score;

  if (Object.keys(updateData).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('rules')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update rule: ${error.message}`);
  }
};

export const deleteRule = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('rules')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete rule: ${error.message}`);
  }
};
