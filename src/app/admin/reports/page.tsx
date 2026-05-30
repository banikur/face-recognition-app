'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import { getAnalysisLogsAction, getProductsAction } from '@/app/admin/actions';
import { AnalysisLog, Product } from '@/data/models';

// ── Constants ─────────────────────────────────────────────────────────────────

const CONDITION_COLORS: Record<string, string> = {
  acne:       '#EF4444',
  blackheads: '#6B7280',
  clear_skin: '#10B981',
  dark_spots: '#8B5CF6',
  puffy_eyes: '#F59E0B',
  wrinkles:   '#3B82F6',
  unknown:    '#94A3B8',
};

const AGE_ORDER = ['<20', '20-35', '36-50', '>50', 'Tidak diketahui'];
const CONDITIONS = ['acne', 'blackheads', 'clear_skin', 'dark_spots', 'puffy_eyes', 'wrinkles'];

type Granularity = 'day' | 'week' | 'month';
type Tab = 'histori' | 'distribusi' | 'produk' | 'tren';

// ── Chart data types ──────────────────────────────────────────────────────────
interface ConditionDistRow { condition: string; count: number; }
interface AgeGroupRow      { ageGroup: string; condition: string; count: number; }
interface TopProductRow    { productId: number; productName: string; count: number; }
interface TrendRow         { date: string; condition: string; count: number; }

interface ChartsData {
  conditionDistribution:  ConditionDistRow[];
  ageGroupDistribution:   AgeGroupRow[];
  topRecommendedProducts: TopProductRow[];
  conditionTrend:         TrendRow[];
  meta: { totalLogs: number; granularity: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCondition(v: string) {
  return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function conditionBadgeClass(c: string) {
  const map: Record<string, string> = {
    acne: 'admin-badge admin-badge-acne',
    blackheads: 'admin-badge admin-badge-oily',
    clear_skin: 'admin-badge admin-badge-normal',
    dark_spots: 'admin-badge admin-badge-dry',
    puffy_eyes: 'admin-badge admin-badge-oily',
    wrinkles:   'admin-badge admin-badge-dry',
  };
  return map[c] || 'admin-badge';
}

// Pivot ageGroupDistribution into [{ageGroup, acne, blackheads, ...}]
function pivotAgeGroup(rows: AgeGroupRow[]) {
  const map: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    if (!map[r.ageGroup]) map[r.ageGroup] = {};
    map[r.ageGroup][r.condition] = r.count;
  }
  return AGE_ORDER
    .filter(g => map[g])
    .map(g => ({ ageGroup: g, ...map[g] }));
}

// Pivot conditionTrend into [{date, acne, blackheads, ...}]
function pivotTrend(rows: TrendRow[]) {
  const map: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    if (!map[r.date]) map[r.date] = {};
    map[r.date][r.condition] = r.count;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, conds]) => ({ date, ...conds }));
}

// Export helpers (reuse existing pattern)
function exportToExcel(rows: Record<string, unknown>[], filename: string) {
  import('xlsx').then((XLSX) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
  });
}

function exportToPDF(rows: Record<string, string>[], title: string, headers: string[]) {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${title}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;color:#1a1a2e}
    h1{font-size:18px;color:#6c63ff;margin-bottom:4px}
    .sub{font-size:11px;color:#888;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#6c63ff;color:#fff;padding:8px 10px;text-align:left}
    td{padding:7px 10px;border-bottom:1px solid #e8e8f0}
    tr:nth-child(even){background:#f5f5ff}
  </style></head><body>
  <h1>${title}</h1>
  <p class="sub">Digenerate: ${new Date().toLocaleString('id-ID')}</p>
  <table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${headers.map(h => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  </body></html>`;
  const w = window.open('', '_blank', 'width=900,height=650');
  if (!w) { alert('Izinkan pop-up untuk mengekspor PDF.'); return; }
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
           style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <svg className="w-10 h-10" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>
    </div>
  );
}

// ── Tab 1: Histori Analisis ───────────────────────────────────────────────────

function TabHistori({ logs, products }: { logs: AnalysisLog[]; products: Product[] }) {
  const [filter, setFilter] = useState({ startDate: '', endDate: '', skinCondition: '', productId: '' });
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const productMap = Object.fromEntries(products.map(p => [String(p.id), p.name]));

  const getProductNames = (ids: string) => {
    if (!ids) return ['—'];
    return ids.split(',').map(id => productMap[id.trim()] ?? `Produk #${id.trim()}`);
  };

  const filtered = logs.filter(log => {
    const d = new Date(log.created_at);
    if (filter.startDate && d < new Date(filter.startDate)) return false;
    if (filter.endDate   && d > new Date(filter.endDate))   return false;
    if (filter.skinCondition && log.dominant_condition !== filter.skinCondition) return false;
    if (filter.productId && !log.recommended_product_ids?.split(',').includes(filter.productId)) return false;
    return true;
  });

  const buildRows = () => filtered.map(log => ({
    Tanggal:    new Date(log.created_at).toLocaleDateString('id-ID'),
    Nama:       log.user_name || 'Guest',
    Usia:       String(log.user_age || '—'),
    Kondisi:    formatCondition(log.dominant_condition || ''),
    Rekomendasi: getProductNames(log.recommended_product_ids).join(', '),
  }));

  const handleExportExcel = () => {
    setExporting('excel');
    exportToExcel(buildRows(), `histori-analisis-${Date.now()}.xlsx`);
    setTimeout(() => setExporting(null), 800);
  };
  const handleExportPDF = () => {
    setExporting('pdf');
    exportToPDF(buildRows(), 'Histori Analisis', ['Tanggal', 'Nama', 'Usia', 'Kondisi', 'Rekomendasi']);
    setTimeout(() => setExporting(null), 800);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="admin-card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Dari Tanggal</label>
            <input type="date" value={filter.startDate} onChange={e => setFilter(f => ({ ...f, startDate: e.target.value }))} className="admin-input" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Sampai Tanggal</label>
            <input type="date" value={filter.endDate} onChange={e => setFilter(f => ({ ...f, endDate: e.target.value }))} className="admin-input" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Kondisi Kulit</label>
            <select value={filter.skinCondition} onChange={e => setFilter(f => ({ ...f, skinCondition: e.target.value }))} className="admin-input">
              <option value="">Semua</option>
              {CONDITIONS.map(c => <option key={c} value={c}>{formatCondition(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Produk</label>
            <select value={filter.productId} onChange={e => setFilter(f => ({ ...f, productId: e.target.value }))} className="admin-input">
              <option value="">Semua</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Export + count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} record
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            {exporting === 'excel' ? '…' : '↓'} Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            {exporting === 'pdf' ? '…' : '↓'} Export PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama</th>
                <th>Usia</th>
                <th>Kondisi Dominan</th>
                <th>Rekomendasi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="font-medium" style={{ color: 'var(--text-main)' }}>
                    {log.user_name || 'Guest'}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {log.user_age > 0 ? `${log.user_age} th` : '—'}
                  </td>
                  <td>
                    <span className={conditionBadgeClass(log.dominant_condition)}>
                      {formatCondition(log.dominant_condition)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {getProductNames(log.recommended_product_ids).join(', ')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5}><EmptyState text="Tidak ada data yang cocok dengan filter" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Distribusi Kondisi Kulit ───────────────────────────────────────────

function TabDistribusi({ chartsData, total }: { chartsData: ChartsData; total: number }) {
  const pieData = chartsData.conditionDistribution.map(r => ({
    name:  formatCondition(r.condition),
    value: r.count,
    key:   r.condition,
  }));

  const barData = pivotAgeGroup(chartsData.ageGroupDistribution);

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: Record<string, number>) => {
    if (percent < 0.05) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    return (
      <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
            fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="admin-card p-5">
          <h3 className="admin-section-header mb-1">Distribusi Kondisi Kulit</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Total {total} analisis</p>
          {pieData.length === 0 ? <EmptyState text="Belum ada data" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" labelLine={false} label={renderLabel}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={CONDITION_COLORS[entry.key] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} analisis`, 'Jumlah']} />
                <Legend formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary table */}
        <div className="admin-card p-5">
          <h3 className="admin-section-header mb-4">Ringkasan per Kondisi</h3>
          <div className="space-y-3">
            {chartsData.conditionDistribution.map(r => {
              const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
              return (
                <div key={r.condition} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-main)' }}>{formatCondition(r.condition)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{r.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-sidebar)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CONDITION_COLORS[r.condition] || '#94A3B8' }} />
                  </div>
                </div>
              );
            })}
            {chartsData.conditionDistribution.length === 0 && (
              <EmptyState text="Belum ada data" />
            )}
          </div>
        </div>
      </div>

      {/* Segmentasi Usia × Kondisi */}
      <div className="admin-card p-5">
        <h3 className="admin-section-header mb-1">Segmentasi Usia per Kondisi Kulit</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Distribusi kondisi berdasarkan kelompok usia</p>
        {barData.length === 0 ? <EmptyState text="Belum ada data usia" /> : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="ageGroup" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend formatter={v => <span style={{ fontSize: 11 }}>{formatCondition(v)}</span>} />
              {CONDITIONS.map(c => (
                <Bar key={c} dataKey={c} name={formatCondition(c)} fill={CONDITION_COLORS[c]} stackId="a" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Rekomendasi Produk ─────────────────────────────────────────────────

function TabProduk({ chartsData }: { chartsData: ChartsData }) {
  const barData = chartsData.topRecommendedProducts;

  return (
    <div className="space-y-6">
      <div className="admin-card p-5">
        <h3 className="admin-section-header mb-1">Produk Paling Sering Direkomendasikan</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Top 10 produk berdasarkan frekuensi rekomendasi</p>
        {barData.length === 0 ? <EmptyState text="Belum ada data" /> : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="productName" tick={{ fontSize: 11 }} width={140} />
              <Tooltip formatter={(v: number) => [`${v}x`, 'Direkomendasikan']} />
              <Bar dataKey="count" name="Frekuensi" radius={[0, 4, 4, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${200 + i * 14},75%,${52 - i * 3}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>Detail Produk</h3>
        </div>
        <table className="admin-table">
          <thead><tr><th>#</th><th>Nama Produk</th><th>Frekuensi</th></tr></thead>
          <tbody>
            {barData.map((row, i) => (
              <tr key={row.productId}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td className="font-medium" style={{ color: 'var(--text-main)' }}>{row.productName}</td>
                <td>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--primary)' }}>
                    {row.count}x
                  </span>
                </td>
              </tr>
            ))}
            {barData.length === 0 && (
              <tr><td colSpan={3}><EmptyState text="Belum ada data" /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 4: Tren Kondisi Kulit ─────────────────────────────────────────────────

function TabTren({ chartsData, granularity, onGranularityChange }:
  { chartsData: ChartsData; granularity: Granularity; onGranularityChange: (g: Granularity) => void }) {

  const lineData = pivotTrend(chartsData.conditionTrend);

  const GRAN_LABELS: Record<Granularity, string> = { day: 'Harian', week: 'Mingguan', month: 'Bulanan' };

  return (
    <div className="space-y-4">
      {/* Toggle granularity */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Tampilkan:</span>
        {(['day', 'week', 'month'] as Granularity[]).map(g => (
          <button
            key={g}
            onClick={() => onGranularityChange(g)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              background: granularity === g ? 'var(--primary)' : 'var(--bg-sidebar)',
              color: granularity === g ? '#fff' : 'var(--text-secondary)',
              border: granularity === g ? 'none' : '1px solid var(--border-soft)',
            }}
          >
            {GRAN_LABELS[g]}
          </button>
        ))}
      </div>

      <div className="admin-card p-5">
        <h3 className="admin-section-header mb-1">Tren Kondisi Kulit</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Jumlah analisis per kondisi kulit ({GRAN_LABELS[granularity].toLowerCase()})
        </p>
        {lineData.length === 0 ? <EmptyState text="Belum ada data tren" /> : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend formatter={v => <span style={{ fontSize: 11 }}>{formatCondition(v)}</span>} />
              {CONDITIONS.map(c => (
                <Line
                  key={c}
                  type="monotone"
                  dataKey={c}
                  name={formatCondition(c)}
                  stroke={CONDITION_COLORS[c]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Main Reports Page ─────────────────────────────────────────────────────────

export default function ReportsAdmin() {
  const [activeTab, setActiveTab]   = useState<Tab>('histori');
  const [granularity, setGranularity] = useState<Granularity>('day');

  const [logs, setLogs]           = useState<AnalysisLog[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [chartsLoading, setChartsLoading] = useState(false);

  // Load logs + products once
  useEffect(() => {
    Promise.all([getAnalysisLogsAction(), getProductsAction()])
      .then(([l, p]) => { setLogs(l); setProducts(p); })
      .finally(() => setLoading(false));
  }, []);

  // Load chart data whenever granularity changes or tab switches to a chart tab
  const loadCharts = useCallback(async (gran: Granularity) => {
    setChartsLoading(true);
    try {
      const res = await fetch(`/api/reports/charts?granularity=${gran}`);
      if (res.ok) setChartsData(await res.json());
    } finally {
      setChartsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'histori') loadCharts(granularity);
  }, [activeTab, granularity, loadCharts]);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'histori',   label: 'Histori Analisis' },
    { key: 'distribusi', label: 'Distribusi Kondisi' },
    { key: 'produk',    label: 'Rekomendasi Produk' },
    { key: 'tren',      label: 'Tren Kondisi' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Laporan &amp; Analitik</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Eksplorasi mendalam data analisis kondisi kulit
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-sidebar)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background:   activeTab === tab.key ? 'var(--bg-surface)' : 'transparent',
              color:        activeTab === tab.key ? 'var(--primary)'    : 'var(--text-muted)',
              boxShadow:    activeTab === tab.key ? 'var(--shadow-sm)'  : 'none',
              fontWeight:   activeTab === tab.key ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <LoadingSpinner />
      ) : activeTab === 'histori' ? (
        <TabHistori logs={logs} products={products} />
      ) : chartsLoading || !chartsData ? (
        <LoadingSpinner />
      ) : activeTab === 'distribusi' ? (
        <TabDistribusi chartsData={chartsData} total={chartsData.meta.totalLogs} />
      ) : activeTab === 'produk' ? (
        <TabProduk chartsData={chartsData} />
      ) : (
        <TabTren
          chartsData={chartsData}
          granularity={granularity}
          onGranularityChange={g => setGranularity(g)}
        />
      )}
    </div>
  );
}
