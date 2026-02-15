'use client';

import { useEffect, useState } from 'react';
import { getIngredientsAction, createIngredientAction, updateIngredientAction, deleteIngredientAction } from '@/app/admin/actions';
import { Ingredient } from '@/data/models';

const CNN_WEIGHTS = [
  { key: 'w_acne', label: 'Acne', color: '#EF4444' },
  { key: 'w_blackheads', label: 'Blackheads', color: '#6B7280' },
  { key: 'w_clear_skin', label: 'Clear Skin', color: '#10B981' },
  { key: 'w_dark_spots', label: 'Dark Spots', color: '#8B5CF6' },
  { key: 'w_puffy_eyes', label: 'Puffy Eyes', color: '#F59E0B' },
  { key: 'w_wrinkles', label: 'Wrinkles', color: '#3B82F6' },
] as const;

const defaultFormData = {
  name: '',
  effect: '',
  w_acne: 0, w_blackheads: 0, w_clear_skin: 0, w_dark_spots: 0, w_puffy_eyes: 0, w_wrinkles: 0
};

export default function IngredientsAdmin() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const data = await getIngredientsAction();
      setIngredients(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({ ...formData, [name]: type === 'number' ? parseFloat(value) || 0 : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIngredient) await updateIngredientAction(editingIngredient.id, formData);
      else await createIngredientAction(formData);
      setFormData(defaultFormData);
      setEditingIngredient(null);
      setShowForm(false);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      effect: ingredient.effect || '',
      w_acne: ingredient.w_acne,
      w_blackheads: ingredient.w_blackheads,
      w_clear_skin: ingredient.w_clear_skin,
      w_dark_spots: ingredient.w_dark_spots,
      w_puffy_eyes: ingredient.w_puffy_eyes,
      w_wrinkles: ingredient.w_wrinkles
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteIngredientAction(id);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const WeightBar = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-16 text-right" style={{ color: 'var(--text-muted)' }}>{label}</span>
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
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bobot per kategori CNN (6)</p>
        </div>
        <button onClick={() => { setFormData(defaultFormData); setEditingIngredient(null); setShowForm(true); }} className="admin-btn-primary">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Add Ingredient
          </span>
        </button>
      </div>

      {showForm && (
        <div className="admin-card p-6">
          <h3 className="admin-section-header mb-4">{editingIngredient ? 'Edit' : 'New'} Ingredient</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Name*</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="admin-input" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Effect</label>
                <input type="text" name="effect" value={formData.effect} onChange={handleInputChange} className="admin-input" placeholder="e.g., Oil control" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
              {CNN_WEIGHTS.map(({ key, label, color }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input
                    type="range"
                    name={key}
                    min="0" max="1" step="0.1"
                    value={formData[key as keyof typeof formData]}
                    onChange={handleInputChange}
                    className="w-full"
                    style={{ accentColor: color }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{(formData[key as keyof typeof formData] * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="admin-btn-secondary">Cancel</button>
              <button type="submit" className="admin-btn-primary">{editingIngredient ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Effect</th>
                <th>Weights (6 CNN)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.id}>
                  <td><span className="font-medium" style={{ color: 'var(--text-main)' }}>{ing.name}</span></td>
                  <td><span className="text-sm" style={{ color: 'var(--text-muted)' }}>{ing.effect || '—'}</span></td>
                  <td>
                    <div className="w-48 space-y-1">
                      {CNN_WEIGHTS.map(({ key, label, color }) => (
                        <WeightBar key={key} value={(ing as Ingredient)[key]} label={label} color={color} />
                      ))}
                    </div>
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleEdit(ing)} className="text-sm font-medium mr-3" style={{ color: 'var(--primary)' }}>Edit</button>
                    <button onClick={() => handleDelete(ing.id)} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Delete</button>
                  </td>
                </tr>
              ))}
              {ingredients.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No ingredients</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
