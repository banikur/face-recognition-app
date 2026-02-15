'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  ingredients: string;
  image_url: string;
  w_acne: number;
  w_blackheads: number;
  w_clear_skin: number;
  w_dark_spots: number;
  w_puffy_eyes: number;
  w_wrinkles: number;
}

interface AnalysisLog {
  id: number;
  user_name: string;
  user_email: string | null;
  user_phone: string | null;
  user_age: number;
  acne_score: number;
  blackheads_score: number;
  clear_skin_score: number;
  dark_spots_score: number;
  puffy_eyes_score: number;
  wrinkles_score: number;
  dominant_condition: string;
  recommended_product_ids: string;
  created_at: string;
}

interface Summary {
  totalAnalyses: number;
  conditionDistribution: Record<string, number>;
  topRecommendedProducts: Array<{ product_id: number; count: number }>;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'analyses' | 'reports'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCondition, setFilterCondition] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    description: '',
    ingredients: '',
    image_url: ''
  });

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'analyses') {
      fetchAnalysisLogs();
    } else if (activeTab === 'reports') {
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAnalysisLogs = async () => {
    try {
      let url = '/api/analysis-logs';
      const params = new URLSearchParams();
      if (filterCondition) params.append('condition', filterCondition);
      if (dateRange.start && dateRange.end) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }
      if (params.toString()) url += '?' + params.toString();

      const response = await fetch(url);
      const data = await response.json();
      setAnalysisLogs(data);
    } catch (error) {
      console.error('Error fetching analysis logs:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      let url = '/api/reports/summary';
      if (dateRange.start && dateRange.end) {
        url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm)
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productForm)
        });
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: '', brand: '', description: '', ingredients: '', image_url: '' });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      brand: product.brand,
      description: product.description,
      ingredients: product.ingredients,
      image_url: product.image_url
    });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const exportExcel = () => {
    let url = '/api/reports/export-xlsx';
    if (dateRange.start && dateRange.end) {
      url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
    }
    window.open(url, '_blank');
  };

  const exportPDF = () => {
    let url = '/api/reports/export-pdf';
    if (dateRange.start && dateRange.end) {
      url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Home
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'products'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('analyses')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'analyses'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analysis Logs
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'reports'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reports
            </button>
          </div>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Products</h2>
              <button
                onClick={() => {
                  setShowProductForm(true);
                  setEditingProduct(null);
                  setProductForm({ name: '', brand: '', description: '', ingredients: '', image_url: '' });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Product
              </button>
            </div>

            {showProductForm && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <form onSubmit={handleProductSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Brand *</label>
                    <input
                      type="text"
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ingredients * (comma separated)</label>
                    <textarea
                      value={productForm.ingredients}
                      onChange={(e) => setProductForm({ ...productForm, ingredients: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      rows={3}
                      required
                      placeholder="e.g., Salicylic Acid, Tea Tree Oil, Charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Image URL</label>
                    <input
                      type="text"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingProduct ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setEditingProduct(null);
                      }}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Brand</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ingredients</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Weights</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-3">{product.name}</td>
                      <td className="px-4 py-3">{product.brand}</td>
                      <td className="px-4 py-3 text-sm">{product.ingredients.substring(0, 50)}...</td>
                      <td className="px-4 py-3 text-xs">
                        <div>Ac: {product.w_acne.toFixed(2)}</div>
                        <div>Bk: {product.w_blackheads.toFixed(2)}</div>
                        <div>Cl: {product.w_clear_skin.toFixed(2)}</div>
                        <div>Dk: {product.w_dark_spots.toFixed(2)}</div>
                        <div>Pf: {product.w_puffy_eyes.toFixed(2)}</div>
                        <div>Wr: {product.w_wrinkles.toFixed(2)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis Logs Tab */}
        {activeTab === 'analyses' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Analysis Logs</h2>

            <div className="mb-6 flex gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Condition</label>
                <select
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="">All</option>
                  <option value="acne">Acne</option>
                  <option value="blackheads">Blackheads</option>
                  <option value="clear_skin">Clear Skin</option>
                  <option value="dark_spots">Dark Spots</option>
                  <option value="puffy_eyes">Puffy Eyes</option>
                  <option value="wrinkles">Wrinkles</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchAnalysisLogs}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Age</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Condition</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Scores</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analysisLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3">
                        <div>{log.user_name}</div>
                        {log.user_email && <div className="text-xs text-gray-500">{log.user_email}</div>}
                      </td>
                      <td className="px-4 py-3">{log.user_age}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm capitalize">
                          {log.dominant_condition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>Ac: {((log.acne_score ?? 0) * 100).toFixed(0)}%</div>
                        <div>Bk: {((log.blackheads_score ?? 0) * 100).toFixed(0)}%</div>
                        <div>Cl: {((log.clear_skin_score ?? 0) * 100).toFixed(0)}%</div>
                        <div>Dk: {((log.dark_spots_score ?? 0) * 100).toFixed(0)}%</div>
                        <div>Pf: {((log.puffy_eyes_score ?? 0) * 100).toFixed(0)}%</div>
                        <div>Wr: {((log.wrinkles_score ?? 0) * 100).toFixed(0)}%</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Reports & Analytics</h2>

            <div className="mb-6 flex gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchSummary}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            {summary && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-blue-600">{summary.totalAnalyses}</div>
                    <div className="text-gray-600">Total Analyses</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-green-600">
                      {Object.keys(summary.conditionDistribution).length}
                    </div>
                    <div className="text-gray-600">Condition Types</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-purple-600">
                      {summary.topRecommendedProducts.length}
                    </div>
                    <div className="text-gray-600">Top Products</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Condition Distribution</h3>
                    <div className="space-y-3">
                      {Object.entries(summary.conditionDistribution).map(([condition, count]) => (
                        <div key={condition}>
                          <div className="flex justify-between mb-1">
                            <span className="capitalize">{condition}</span>
                            <span>{count} ({((count / summary.totalAnalyses) * 100).toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(count / summary.totalAnalyses) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Top Recommended Products</h3>
                    <div className="space-y-2">
                      {summary.topRecommendedProducts.map((item, index) => (
                        <div key={item.product_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <span className="font-medium">#{index + 1} Product ID: {item.product_id}</span>
                          <span className="text-blue-600">{item.count} times</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={exportExcel}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Export to Excel
                  </button>
                  <button
                    onClick={exportPDF}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Export to PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
