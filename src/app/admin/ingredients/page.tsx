'use client';

import { useEffect, useState } from 'react';
import { getIngredientsAction, createIngredientAction, updateIngredientAction, deleteIngredientAction } from '@/app/admin/actions';
import { Ingredient } from '@/data/models';

export default function IngredientsAdmin() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    effect: '',
    w_oily: 0,
    w_dry: 0,
    w_normal: 0,
    w_acne: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getIngredientsAction();
      setIngredients(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIngredient) {
        await updateIngredientAction(editingIngredient.id, formData);
      } else {
        await createIngredientAction(formData);
      }
      resetForm();
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving ingredient:', error);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      effect: ingredient.effect || '',
      w_oily: ingredient.w_oily,
      w_dry: ingredient.w_dry,
      w_normal: ingredient.w_normal,
      w_acne: ingredient.w_acne
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await deleteIngredientAction(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting ingredient:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingIngredient(null);
    setFormData({ name: '', effect: '', w_oily: 0, w_dry: 0, w_normal: 0, w_acne: 0 });
  };

  const WeightBar = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-6 text-right" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] w-6" style={{ color: 'var(--text-muted)' }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Ingredients</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Master data with weight mapping</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="admin-btn-primary">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Ingredient
          </span>
        </button>
      </div>

      {showForm && (
        <div className="admin-card p-6">
          <h3 className="admin-section-header mb-4">
            {editingIngredient ? 'Edit Ingredient' : 'New Ingredient'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Ingredient Name*
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
                  Effect
                </label>
                <input
                  type="text"
                  name="effect"
                  value={formData.effect}
                  onChange={handleInputChange}
                  className="admin-input"
                  placeholder="e.g., Oil control, acne treatment"
                />
              </div>
            </div>

            {/* Weight Sliders */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Oily Weight
                </label>
                <input
                  type="range"
                  name="w_oily"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.w_oily}
                  onChange={handleInputChange}
                  className="w-full accent-yellow-500"
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(formData.w_oily * 100).toFixed(0)}%</span>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Dry Weight
                </label>
                <input
                  type="range"
                  name="w_dry"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.w_dry}
                  onChange={handleInputChange}
                  className="w-full accent-blue-500"
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(formData.w_dry * 100).toFixed(0)}%</span>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Normal Weight
                </label>
                <input
                  type="range"
                  name="w_normal"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.w_normal}
                  onChange={handleInputChange}
                  className="w-full accent-green-500"
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(formData.w_normal * 100).toFixed(0)}%</span>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  Acne Weight
                </label>
                <input
                  type="range"
                  name="w_acne"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.w_acne}
                  onChange={handleInputChange}
                  className="w-full accent-red-500"
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(formData.w_acne * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="admin-btn-secondary">
                Cancel
              </button>
              <button type="submit" className="admin-btn-primary">
                {editingIngredient ? 'Update' : 'Create'}
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
                <th>Ingredient</th>
                <th>Effect</th>
                <th>Weights (O/D/N/A)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => (
                <tr key={ingredient.id}>
                  <td>
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>{ingredient.name}</span>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{ingredient.effect || '—'}</span>
                  </td>
                  <td>
                    <div className="w-40 space-y-1">
                      <WeightBar value={ingredient.w_oily} label="O" color="#F59E0B" />
                      <WeightBar value={ingredient.w_dry} label="D" color="#3B82F6" />
                      <WeightBar value={ingredient.w_normal} label="N" color="#10B981" />
                      <WeightBar value={ingredient.w_acne} label="A" color="#EF4444" />
                    </div>
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleEdit(ingredient)} className="text-sm font-medium mr-3" style={{ color: 'var(--primary)' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(ingredient.id)} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {ingredients.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No ingredients found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}