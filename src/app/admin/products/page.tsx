'use client';

import { useEffect, useState } from 'react';
import {
  getProductsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  getBrandsAction,
  getCategoriesAction,
  getIngredientsAction,
  getProductIngredientsAction
} from '@/app/admin/actions';
import { Product, Brand, ProductCategory, Ingredient } from '@/data/models';

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand_id: '' as string | number,
    category_id: '' as string | number,
    description: '',
    image_url: '',
    ingredient_ids: [] as number[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, brandsData, categoriesData, ingredientsData] = await Promise.all([
        getProductsAction(),
        getBrandsAction(),
        getCategoriesAction(),
        getIngredientsAction()
      ]);
      setProducts(productsData);
      setBrands(brandsData);
      setCategories(categoriesData);
      setIngredients(ingredientsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.endsWith('_id') ? (value ? parseInt(value) : '') : value
    });
  };

  const handleIngredientToggle = (ingredientId: number) => {
    setFormData(prev => ({
      ...prev,
      ingredient_ids: prev.ingredient_ids.includes(ingredientId)
        ? prev.ingredient_ids.filter(id => id !== ingredientId)
        : [...prev.ingredient_ids, ingredientId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        brand_id: formData.brand_id ? Number(formData.brand_id) : null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        description: formData.description,
        image_url: formData.image_url,
        ingredient_ids: formData.ingredient_ids
      };

      if (editingProduct) {
        await updateProductAction(editingProduct.id, data);
      } else {
        await createProductAction(data);
      }

      resetForm();
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = async (product: Product) => {
    // Fetch product ingredients
    const productIngredients = await getProductIngredientsAction(product.id);
    const ingredientIds = productIngredients.map(i => i.id);

    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand_id: product.brand_id || '',
      category_id: product.category_id || '',
      description: product.description || '',
      image_url: product.image_url || '',
      ingredient_ids: ingredientIds
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProductAction(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      brand_id: '',
      category_id: '',
      description: '',
      image_url: '',
      ingredient_ids: []
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Products</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage product catalog</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="admin-btn-primary">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </span>
        </button>
      </div>

      {showForm && (
        <div className="admin-card p-6">
          <h3 className="admin-section-header mb-4">
            {editingProduct ? 'Edit Product' : 'New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Product Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="admin-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Image URL
                </label>
                <input
                  type="text"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="admin-input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Brand
                </label>
                <select
                  name="brand_id"
                  value={formData.brand_id}
                  onChange={handleInputChange}
                  className="admin-input"
                >
                  <option value="">Select brand</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Category
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="admin-input"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="admin-input"
              />
            </div>

            {/* Ingredients Multi-Select */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Ingredients (select to calculate weights)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-lg max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                {ingredients.map(ingredient => (
                  <label
                    key={ingredient.id}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
                    style={{
                      backgroundColor: formData.ingredient_ids.includes(ingredient.id) ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                      border: formData.ingredient_ids.includes(ingredient.id) ? '1px solid var(--primary)' : '1px solid transparent'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.ingredient_ids.includes(ingredient.id)}
                      onChange={() => handleIngredientToggle(ingredient.id)}
                      className="rounded"
                    />
                    <span className="text-xs" style={{ color: 'var(--text-main)' }}>{ingredient.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Selected: {formData.ingredient_ids.length} ingredients
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="admin-btn-secondary">
                Cancel
              </button>
              <button type="submit" className="admin-btn-primary">
                {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Weights</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-main)' }}>{product.name}</p>
                      <p className="text-xs truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>{product.description}</p>
                    </div>
                  </td>
                  <td>
                    {product.brand_name || '—'}
                  </td>
                  <td>
                    {product.category_name ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)' }}>
                        {product.category_name}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                      <span className="px-1 rounded" style={{ backgroundColor: '#FEE2E2' }}>Ac:{(product.w_acne * 100).toFixed(0)}</span>
                      <span className="px-1 rounded" style={{ backgroundColor: '#E5E7EB' }}>Bk:{(product.w_blackheads * 100).toFixed(0)}</span>
                      <span className="px-1 rounded" style={{ backgroundColor: '#D1FAE5' }}>Cl:{(product.w_clear_skin * 100).toFixed(0)}</span>
                      <span className="px-1 rounded" style={{ backgroundColor: '#E9D5FF' }}>Dk:{(product.w_dark_spots * 100).toFixed(0)}</span>
                      <span className="px-1 rounded" style={{ backgroundColor: '#FEF3C7' }}>Pf:{(product.w_puffy_eyes * 100).toFixed(0)}</span>
                      <span className="px-1 rounded" style={{ backgroundColor: '#DBEAFE' }}>Wr:{(product.w_wrinkles * 100).toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleEdit(product)} className="text-sm font-medium mr-3" style={{ color: 'var(--primary)' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}