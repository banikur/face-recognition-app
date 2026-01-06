'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [skinTypes, setSkinTypes] = useState<SkinType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState<Omit<Rule, 'id'>>({
    skin_type_id: 0,
    product_id: 0,
    confidence_score: 0.0
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

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'confidence_score' ? parseFloat(value) : parseInt(value)
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
        confidence_score: 0.0
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
      confidence_score: rule.confidence_score
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Rules</h1>
          <p className="text-gray-600 mt-2">Configure recommendation rules for skin types and products</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recommendation Rules</h2>
            <button
              onClick={() => {
                setEditingRule(null);
                setFormData({
                  skin_type_id: 0,
                  product_id: 0,
                  confidence_score: 0.0
                });
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Add New Rule
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingRule ? 'Edit Rule' : 'Add New Rule'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="skin_type_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Skin Type
                  </label>
                  <select
                    id="skin_type_id"
                    name="skin_type_id"
                    value={formData.skin_type_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Product
                  </label>
                  <select
                    id="product_id"
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="confidence_score" className="block text-sm font-medium text-gray-700 mb-1">
                    Confidence Score (0.0 - 1.0)
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {editingRule ? 'Update Rule' : 'Add Rule'}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8">
              <p>Loading rules...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skin Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getSkinTypeName(rule.skin_type_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getProductName(rule.product_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rule.confidence_score.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(rule)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:text-gray-900 focus:outline-none"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}