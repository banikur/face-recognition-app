'use client';

import { useEffect, useState } from 'react';
import {
  Rule,
  SkinType,
  Product
} from '@/data/models';
import {
  getRulesAction,
  createRuleAction,
  updateRuleAction,
  deleteRuleAction,
  getSkinTypesAction,
  getProductsAction
} from './actions';

export default function RulesAdmin() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [skinTypes, setSkinTypes] = useState<SkinType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState<Omit<Rule, 'id'>>({
    skin_type_id: 0,
    product_id: 0,
    confidence_score: 0.0,
    explanation: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesData, skinTypesData, productsData] = await Promise.all([
        getRulesAction(),
        getSkinTypesAction(),
        getProductsAction()
      ]);
      setRules(rulesData);
      setSkinTypes(skinTypesData);
      setProducts(productsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'explanation') {
      setFormData({ ...formData, [name]: value });
      return;
    }

    setFormData({
      ...formData,
      [name]: name === 'confidence_score'
        ? (parseFloat(value) || 0)
        : (value ? parseInt(value, 10) : 0)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRule) {
        await updateRuleAction(editingRule.id, formData);
      } else {
        await createRuleAction(formData);
      }

      // Reset form and refresh data
      setFormData({
        skin_type_id: 0,
        product_id: 0,
        confidence_score: 0.0,
        explanation: ''
      });
      setEditingRule(null);
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      skin_type_id: rule.skin_type_id,
      product_id: rule.product_id,
      confidence_score: rule.confidence_score,
      explanation: rule.explanation || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRuleAction(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting rule:', error);
      }
    }
  };

  const getSkinTypeName = (id: number) => {
    const skinType = skinTypes.find(st => st.id === id);
    return skinType ? skinType.name : 'Unknown';
  };

  const getProductName = (id: number) => {
    const product = products.find(p => p.id === id);
    return product ? product.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Rules</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Configure recommendation rules for skin types and products</p>
        </div>
        <button
          onClick={() => {
            setEditingRule(null);
            setFormData({
              skin_type_id: 0,
              product_id: 0,
              confidence_score: 0.0,
              explanation: ''
            });
            setShowForm(true);
          }}
          className="admin-btn-primary"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Rule
          </span>
        </button>
      </div>

      {showForm && (
        <div className="admin-card p-6">
          <h3 className="admin-section-header mb-4">
            {editingRule ? 'Edit Rule' : 'New Rule'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="skin_type_id" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Skin Type*
                </label>
                <select
                  id="skin_type_id"
                  name="skin_type_id"
                  value={formData.skin_type_id || ''}
                  onChange={handleInputChange}
                  required
                  className="admin-input"
                >
                  <option value="">Select Skin Type</option>
                  {skinTypes.map(skinType => (
                    <option key={skinType.id} value={skinType.id}>
                      {skinType.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="product_id" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Product*
                </label>
                <select
                  id="product_id"
                  name="product_id"
                  value={formData.product_id || ''}
                  onChange={handleInputChange}
                  required
                  className="admin-input"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="confidence_score" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Confidence Score (0.0 - 1.0)*
                </label>
                <input
                  type="number"
                  id="confidence_score"
                  name="confidence_score"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.confidence_score}
                  onChange={handleInputChange}
                  required
                  className="admin-input"
                />
              </div>
              <div>
                <label htmlFor="explanation" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Explanation (Trivia)
                </label>
                <textarea
                  id="explanation"
                  name="explanation"
                  rows={3}
                  value={formData.explanation || ''}
                  onChange={handleInputChange}
                  className="admin-input"
                  placeholder="Why is this product recommended?"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="admin-btn-secondary">
                Cancel
              </button>
              <button type="submit" className="admin-btn-primary">
                {editingRule ? 'Update' : 'Create'}
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
                <th>Skin Type</th>
                <th>Product</th>
                <th>Confidence</th>
                <th>Explanation</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>{getSkinTypeName(rule.skin_type_id)}</span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)' }}>{getProductName(rule.product_id)}</span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)' }}>{rule.confidence_score.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{rule.explanation ? (rule.explanation.substring(0, 50) + (rule.explanation.length > 50 ? '...' : '')) : '-'}</span>
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleEdit(rule)} className="text-sm font-medium mr-3" style={{ color: 'var(--primary)' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No rules found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}