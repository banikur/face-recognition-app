'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAnalysisLogsAction,
  getProductsAction,
  getSkinTypesAction
} from '@/app/admin/actions';
import { AnalysisLog, Product, SkinType } from '@/data/models';

export default function ReportsAdmin() {
  const router = useRouter();
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [skinTypes, setSkinTypes] = useState<SkinType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    skinCondition: '',
    productId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsData, productsData, skinTypesData] = await Promise.all([
        getAnalysisLogsAction(),
        getProductsAction(),
        getSkinTypesAction()
      ]);
      setLogs(logsData);
      setProducts(productsData);
      setSkinTypes(skinTypesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  const getProductName = (idString: string) => {
    if (!idString) return 'None';
    const ids = idString.split(',').map(s => parseInt(s.trim()));
    const productNames = ids.map(id => {
      const product = products.find(p => p.id === id);
      return product ? product.name : `Unknown (${id})`;
    });
    return productNames.join(', ');
  };

  const generateMostRecommendedReport = () => {
    const productCount: Record<string, number> = {};
    logs.forEach(log => {
      if (log.recommended_product_ids) {
        const ids = log.recommended_product_ids.split(',');
        ids.forEach(idStr => {
          const id = parseInt(idStr.trim());
          if (!isNaN(id)) {
            productCount[id] = (productCount[id] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, count]) => ({
        product: products.find(p => p.id === parseInt(productId))?.name || `Unknown (${productId})`,
        count
      }));
  };

  const generateMostCommonSkinTypes = () => {
    const skinTypeCount: Record<string, number> = {};
    logs.forEach(log => {
      const condition = log.dominant_condition || 'Unknown';
      skinTypeCount[condition] = (skinTypeCount[condition] || 0) + 1;
    });

    return Object.entries(skinTypeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([skinType, count]) => ({ skinType, count }));
  };

  const mostRecommendedProducts = generateMostRecommendedReport();
  const mostCommonSkinTypes = generateMostCommonSkinTypes();

  const filteredLogs = logs.filter(log => {
    const matchesDate = (!filter.startDate || new Date(log.created_at) >= new Date(filter.startDate)) &&
      (!filter.endDate || new Date(log.created_at) <= new Date(filter.endDate));
    const matchesCondition = !filter.skinCondition || log.dominant_condition === filter.skinCondition;
    const matchesProduct = !filter.productId || (log.recommended_product_ids && log.recommended_product_ids.split(',').includes(filter.productId));
    return matchesDate && matchesCondition && matchesProduct;
  });

  const getConditionBadge = (condition: string) => {
    const badges: Record<string, string> = {
      oily: 'admin-badge admin-badge-oily',
      dry: 'admin-badge admin-badge-dry',
      acne: 'admin-badge admin-badge-acne',
      normal: 'admin-badge admin-badge-normal',
    };
    return badges[condition] || 'admin-badge';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Reports & Analytics</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Deep dive into analysis data</p>
      </div>

      {/* Filter Bar */}
      <div className="admin-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Condition</label>
            <select name="skinCondition" value={filter.skinCondition} onChange={handleFilterChange} className="admin-input">
              <option value="">All</option>
              {skinTypes.map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Product</label>
            <select name="productId" value={filter.productId} onChange={handleFilterChange} className="admin-input">
              <option value="">All</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="admin-card p-5">
          <h3 className="admin-section-header">Top Products</h3>
          <div className="space-y-3 mt-4">
            {mostRecommendedProducts.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{
                      background: idx === 0 ? 'var(--gradient-metric)' : 'var(--bg-sidebar)',
                      color: idx === 0 ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>{item.product}</span>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}
                >
                  {item.count} rec.
                </span>
              </div>
            ))}
            {mostRecommendedProducts.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data available</p>
            )}
          </div>
        </div>

        {/* Skin Type Distribution */}
        <div className="admin-card p-5">
          <h3 className="admin-section-header">Skin Type Distribution</h3>
          <div className="space-y-3 mt-4">
            {mostCommonSkinTypes.map((item, idx) => {
              const total = logs.length || 1;
              const percentage = Math.round((item.count / total) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium capitalize" style={{ color: 'var(--text-main)' }}>{item.skinType}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.count} ({percentage}%)</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--bg-sidebar)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        background: 'var(--gradient-metric)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {mostCommonSkinTypes.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="admin-card overflow-hidden">
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>Analysis Logs</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Condition</th>
                  <th>Recommendation</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={getConditionBadge(log.dominant_condition)}>
                        {log.dominant_condition}
                      </span>
                    </td>
                    <td>
                      <span className="truncate max-w-xs block">{getProductName(log.recommended_product_ids)}</span>
                    </td>
                    <td>{log.user_name || 'Guest'}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                      No logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}