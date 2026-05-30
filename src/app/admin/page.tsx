import Link from 'next/link';
import { getAnalysisStatsAction } from './actions';

export default async function AdminDashboard() {
  const stats = await getAnalysisStatsAction();
  const uniqueUsers = new Set(stats.recentLogs.map(l => l.user_name).filter(Boolean)).size;

  const tools = [
    {
      name: 'Produk',
      desc: 'Kelola katalog produk skincare',
      href: '/admin/products',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    },
    {
      name: 'Rules',
      desc: 'Atur pemetaan kondisi ke produk',
      href: '/admin/rules',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
    },
    {
      name: 'Bahan Aktif',
      desc: 'Ingredients & bobot kondisi',
      href: '/admin/ingredients',
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
    },
    {
      name: 'Laporan',
      desc: 'Analitik & distribusi kondisi',
      href: '/admin/reports',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z'
    },
  ];

  const getConditionBadge = (condition: string) => {
    const badges: Record<string, string> = {
      acne:       'admin-badge admin-badge-acne',
      blackheads: 'admin-badge admin-badge-oily',
      clear_skin: 'admin-badge admin-badge-normal',
      dark_spots: 'admin-badge admin-badge-dry',
      puffy_eyes: 'admin-badge admin-badge-oily',
      wrinkles:   'admin-badge admin-badge-dry',
    };
    return badges[condition] || 'admin-badge';
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Ringkasan sistem dan akses cepat
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-metric-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">Total Analisis</p>
              <p className="text-3xl font-bold mt-1">{stats.totalAnalysis}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="admin-metric-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">Total Produk</p>
              <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="admin-metric-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">Pengguna Unik</p>
              <p className="text-3xl font-bold mt-1">{uniqueUsers || '—'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Management Tools Grid */}
      <div>
        <h2 className="admin-section-header mb-4">Manajemen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href}
              className="admin-card-interactive p-4 group block"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tool.icon} />
                  </svg>
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                  {tool.name}
                </span>
              </div>
              <p className="text-xs pl-12" style={{ color: 'var(--text-muted)' }}>{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Analysis Table */}
      <div>
        <h2 className="admin-section-header mb-4">Aktivitas Terbaru</h2>
        <div className="admin-card overflow-hidden">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Usia</th>
                <th>Kondisi</th>
                <th>Skor (Ac/Cl/Wr)</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className="font-medium" style={{ color: 'var(--text-main)' }}>
                      {log.user_name || 'Guest'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {log.user_age > 0 ? `${log.user_age} th` : '—'}
                  </td>
                  <td>
                    <span className={getConditionBadge(log.dominant_condition)}>
                      {log.dominant_condition}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {Math.round(log.acne_score * 100)} /
                      {Math.round(log.clear_skin_score * 100)} /
                      {Math.round(log.wrinkles_score * 100)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))}
              {stats.recentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                    Belum ada aktivitas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
