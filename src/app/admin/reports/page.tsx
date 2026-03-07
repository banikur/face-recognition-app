'use client';

import { useEffect, useState } from 'react';
import {
  getAnalysisLogsAction,
  getProductsAction,
  getSkinTypesAction
} from '@/app/admin/actions';
import { AnalysisLog, Product, SkinType } from '@/data/models';

// ---------- helpers ----------
function exportToExcel(rows: ExportRow[], filename: string) {
  import('xlsx').then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 20 }, // Date
      { wch: 20 }, // Condition
      { wch: 40 }, // Products
      { wch: 20 }, // User
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analysis Logs');
    XLSX.writeFile(wb, filename);
  });
}

function exportToPDF(rows: ExportRow[], title: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 32px; }
        h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; color: #6c63ff; }
        .subtitle { font-size: 12px; color: #888; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        thead tr { background: #6c63ff; color: white; }
        th { padding: 10px 12px; text-align: left; font-weight: 600; }
        tbody tr:nth-child(even) { background: #f5f5ff; }
        td { padding: 8px 12px; border-bottom: 1px solid #e8e8f0; vertical-align: top; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          background: #ede9fe;
          color: #6c63ff;
        }
        .footer { margin-top: 24px; font-size: 11px; color: #aaa; text-align: right; }
        @media print {
          body { padding: 16px; }
          button { display: none !important; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Condition</th>
            <th>Recommended Products</th>
            <th>User</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              <td>${r['Date']}</td>
              <td><span class="badge">${r['Condition']}</span></td>
              <td>${r['Recommended Products']}</td>
              <td>${r['User']}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">Total records: ${rows.length}</div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=900,height=650');
  if (!win) {
    alert('Please allow pop-ups for this site to export PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}

// ---------- types ----------
interface ExportRow {
  Date: string;
  Condition: string;
  'Recommended Products': string;
  User: string;
}

// ---------- component ----------
export default function ReportsAdmin() {
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [skinTypes, setSkinTypes] = useState<SkinType[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
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

  const formatCondition = (value: string) =>
    value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const getProductName = (idString: string) => {
    if (!idString) return ['None'];
    const ids = idString.split(',').map(s => parseInt(s.trim(), 10));
    return ids.map(id => {
      const product = products.find(p => Number(p.id) === id);
      return product ? product.name : `Product #${id}`;
    });
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
        product: products.find(p => Number(p.id) === Number(productId))?.name || `Product #${productId}`,
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
    const matchesDate =
      (!filter.startDate || new Date(log.created_at) >= new Date(filter.startDate)) &&
      (!filter.endDate || new Date(log.created_at) <= new Date(filter.endDate));
    const matchesCondition = !filter.skinCondition || log.dominant_condition === filter.skinCondition;
    const matchesProduct =
      !filter.productId ||
      (log.recommended_product_ids && log.recommended_product_ids.split(',').includes(filter.productId));
    return matchesDate && matchesCondition && matchesProduct;
  });

  const getConditionBadge = (condition: string) => {
    const badges: Record<string, string> = {
      acne: 'admin-badge admin-badge-acne',
      blackheads: 'admin-badge admin-badge-oily',
      clear_skin: 'admin-badge admin-badge-normal',
      dark_spots: 'admin-badge admin-badge-dry',
      puffy_eyes: 'admin-badge admin-badge-oily',
      wrinkles: 'admin-badge admin-badge-dry',
    };
    return badges[condition] || 'admin-badge';
  };

  // Build export rows from the currently filtered logs
  const buildExportRows = (): ExportRow[] =>
    filteredLogs.map(log => ({
      Date: new Date(log.created_at).toLocaleDateString(),
      Condition: formatCondition(log.dominant_condition || ''),
      'Recommended Products': getProductName(log.recommended_product_ids).join(', '),
      User: log.user_name || 'Guest',
    }));

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      exportToExcel(buildExportRows(), `analysis-report-${Date.now()}.xlsx`);
    } finally {
      setTimeout(() => setExporting(null), 800);
    }
  };

  const handleExportPDF = () => {
    setExporting('pdf');
    try {
      exportToPDF(buildExportRows(), 'Analysis Logs Report');
    } finally {
      setTimeout(() => setExporting(null), 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>
            Reports &amp; Analytics
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Deep dive into analysis data
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="export-excel-btn"
            onClick={handleExportExcel}
            disabled={exporting !== null || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: exporting === 'excel' ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)',
              color: 'var(--success, #10b981)',
              border: '1px solid rgba(16,185,129,0.3)',
              cursor: exporting !== null || loading ? 'not-allowed' : 'pointer',
              opacity: exporting !== null || loading ? 0.7 : 1,
            }}
          >
            {exporting === 'excel' ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            Export Excel
          </button>

          <button
            id="export-pdf-btn"
            onClick={handleExportPDF}
            disabled={exporting !== null || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: exporting === 'pdf' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239,68,68,0.3)',
              cursor: exporting !== null || loading ? 'not-allowed' : 'pointer',
              opacity: exporting !== null || loading ? 0.7 : 1,
            }}
          >
            {exporting === 'pdf' ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            )}
            Export PDF
          </button>
        </div>
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
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>
                      {formatCondition(item.skinType)}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{item.count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-sidebar)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, background: 'var(--gradient-metric)' }}
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
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-soft)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>Analysis Logs</h3>
          {!loading && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--primary)' }}>
              {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''}
            </span>
          )}
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
                      <div className="flex flex-col gap-1 max-w-xs">
                        {getProductName(log.recommended_product_ids).map((name) => (
                          <span key={name} className="block">{name}</span>
                        ))}
                      </div>
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