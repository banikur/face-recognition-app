'use server';

import {
    // Brands
    getAllBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    // Categories
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    // Ingredients
    getAllIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    getProductIngredients,
    // Recommendations
    getAllRecommendations,
    createRecommendation,
    updateRecommendation,
    deleteRecommendation,
    // Products
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    // Analysis
    getAllAnalysisLogs,
    // Legacy
    getAllSkinTypes,
    createSkinType,
    updateSkinType,
    deleteSkinType,
    // Types
    Brand,
    ProductCategory,
    Ingredient,
    Recommendation,
    Product,
    AnalysisLog,
    SkinType
} from '@/data/models';
import { revalidatePath } from 'next/cache';

// ============================================
// BRANDS ACTIONS
// ============================================

export async function getBrandsAction(): Promise<Brand[]> {
    try {
        return await getAllBrands();
    } catch (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
}

export async function createBrandAction(data: { name: string; logo_url?: string }) {
    try {
        const result = await createBrand({ name: data.name, logo_url: data.logo_url || null });
        revalidatePath('/admin/brands');
        return { success: true, id: result };
    } catch (error) {
        console.error('Error creating brand:', error);
        return { success: false, error: 'Failed to create brand' };
    }
}

export async function updateBrandAction(id: number, data: { name?: string; logo_url?: string }) {
    try {
        await updateBrand(id, data);
        revalidatePath('/admin/brands');
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error('Error updating brand:', error);
        return { success: false, error: 'Failed to update brand' };
    }
}

export async function deleteBrandAction(id: number) {
    try {
        await deleteBrand(id);
        revalidatePath('/admin/brands');
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error('Error deleting brand:', error);
        return { success: false, error: 'Failed to delete brand' };
    }
}

// ============================================
// CATEGORIES ACTIONS
// ============================================

export async function getCategoriesAction(): Promise<ProductCategory[]> {
    try {
        return await getAllCategories();
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function createCategoryAction(data: { name: string; description?: string }) {
    try {
        const result = await createCategory({ name: data.name, description: data.description || null });
        revalidatePath('/admin/categories');
        return { success: true, id: result };
    } catch (error) {
        console.error('Error creating category:', error);
        return { success: false, error: 'Failed to create category' };
    }
}

export async function updateCategoryAction(id: number, data: { name?: string; description?: string }) {
    try {
        await updateCategory(id, data);
        revalidatePath('/admin/categories');
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error('Error updating category:', error);
        return { success: false, error: 'Failed to update category' };
    }
}

export async function deleteCategoryAction(id: number) {
    try {
        await deleteCategory(id);
        revalidatePath('/admin/categories');
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: 'Failed to delete category' };
    }
}

// ============================================
// INGREDIENTS ACTIONS
// ============================================

export async function getIngredientsAction(): Promise<Ingredient[]> {
    try {
        return await getAllIngredients();
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        return [];
    }
}

export async function createIngredientAction(data: Omit<Ingredient, 'id' | 'created_at'>) {
    try {
        await createIngredient(data);
        revalidatePath('/admin/ingredients');
        return { success: true };
    } catch (error) {
        console.error('Error creating ingredient:', error);
        return { success: false, error: 'Failed to create ingredient' };
    }
}

export async function updateIngredientAction(id: number, data: Partial<Omit<Ingredient, 'id' | 'created_at'>>) {
    try {
        await updateIngredient(id, data);
        revalidatePath('/admin/ingredients');
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error('Error updating ingredient:', error);
        return { success: false, error: 'Failed to update ingredient' };
    }
}

export async function deleteIngredientAction(id: number) {
    try {
        await deleteIngredient(id);
        revalidatePath('/admin/ingredients');
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        return { success: false, error: 'Failed to delete ingredient' };
    }
}

// ============================================
// RECOMMENDATIONS ACTIONS
// ============================================

export async function getRecommendationsAction(): Promise<Recommendation[]> {
    try {
        return await getAllRecommendations();
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}

export async function createRecommendationAction(data: Omit<Recommendation, 'id' | 'created_at'>) {
    try {
        const result = await createRecommendation(data);
        revalidatePath('/admin/recommendations');
        return { success: true, id: result };
    } catch (error) {
        console.error('Error creating recommendation:', error);
        return { success: false, error: 'Failed to create recommendation' };
    }
}

export async function updateRecommendationAction(id: number, data: Partial<Omit<Recommendation, 'id' | 'created_at'>>) {
    try {
        await updateRecommendation(id, data);
        revalidatePath('/admin/recommendations');
        return { success: true };
    } catch (error) {
        console.error('Error updating recommendation:', error);
        return { success: false, error: 'Failed to update recommendation' };
    }
}

export async function deleteRecommendationAction(id: number) {
    try {
        await deleteRecommendation(id);
        revalidatePath('/admin/recommendations');
        return { success: true };
    } catch (error) {
        console.error('Error deleting recommendation:', error);
        return { success: false, error: 'Failed to delete recommendation' };
    }
}

// ============================================
// PRODUCTS ACTIONS
// ============================================

export async function getProductsAction(): Promise<Product[]> {
    try {
        return await getAllProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

export async function getProductIngredientsAction(productId: number): Promise<Ingredient[]> {
    try {
        return await getProductIngredients(productId);
    } catch (error) {
        console.error('Error fetching product ingredients:', error);
        return [];
    }
}

export async function createProductAction(data: {
    name: string;
    brand_id?: number | null;
    category_id?: number | null;
    description?: string;
    image_url?: string;
    ingredient_ids?: number[];
}) {
    try {
        const result = await createProduct(data);
        revalidatePath('/admin/products');
        return { success: true, id: result };
    } catch (error) {
        console.error('Error creating product:', error);
        return { success: false, error: 'Failed to create product' };
    }
}

export async function updateProductAction(id: number, data: {
    name?: string;
    brand_id?: number | null;
    category_id?: number | null;
    description?: string;
    image_url?: string;
    ingredient_ids?: number[];
}) {
    try {
        await updateProduct(id, data);
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error('Error updating product:', error);
        return { success: false, error: 'Failed to update product' };
    }
}

export async function deleteProductAction(id: number) {
    try {
        await deleteProduct(id);
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error('Error deleting product:', error);
        return { success: false, error: 'Failed to delete product' };
    }
}

// ============================================
// ANALYSIS LOGS ACTIONS
// ============================================

export async function getAnalysisLogsAction(): Promise<AnalysisLog[]> {
    try {
        return await getAllAnalysisLogs();
    } catch (error) {
        console.error('Error fetching analysis logs:', error);
        return [];
    }
}

export async function getAnalysisStatsAction() {
    try {
        const logs = await getAllAnalysisLogs();
        const products = await getAllProducts();

        const totalAnalysis = logs.length;

        const conditionCounts: Record<string, number> = {};
        logs.forEach(log => {
            const cond = log.dominant_condition || 'unknown';
            conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
        });

        const recentLogs = logs.slice(0, 5);

        return {
            totalAnalysis,
            totalProducts: products.length,
            conditionCounts,
            recentLogs
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
        return {
            totalAnalysis: 0,
            totalProducts: 0,
            conditionCounts: {},
            recentLogs: []
        };
    }
}

// ============================================
// LEGACY: SKIN TYPES (backward compatibility)
// ============================================

export async function getSkinTypesAction(): Promise<SkinType[]> {
    try {
        return await getAllSkinTypes();
    } catch (error) {
        console.error('Error fetching skin types:', error);
        return [];
    }
}

export async function createSkinTypeAction(data: Omit<SkinType, 'id' | 'created_at'>) {
    try {
        const result = await createSkinType(data);
        revalidatePath('/admin/recommendations');
        return { success: true, id: result };
    } catch (error) {
        console.error('Error creating skin type:', error);
        return { success: false, error: 'Failed to create skin type' };
    }
}

export async function updateSkinTypeAction(id: number, data: Partial<Omit<SkinType, 'id' | 'created_at'>>) {
    try {
        await updateSkinType(id, data);
        revalidatePath('/admin/recommendations');
        return { success: true };
    } catch (error) {
        console.error('Error updating skin type:', error);
        return { success: false, error: 'Failed to update skin type' };
    }
}

export async function deleteSkinTypeAction(id: number) {
    try {
        await deleteSkinType(id);
        revalidatePath('/admin/recommendations');
        return { success: true };
    } catch (error) {
        console.error('Error deleting skin type:', error);
        return { success: false, error: 'Failed to delete skin type' };
    }
}
