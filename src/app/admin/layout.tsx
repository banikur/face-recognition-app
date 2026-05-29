import { redirect } from 'next/navigation';
import { getSession } from '@/lib/simple-auth';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect('/login');

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
  ];

  const masterGroup = {
    label: 'Master',
    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    items: [
      {
        name: 'Master Produk',
        href: '/admin/products',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
      },
      {
        name: 'Master Kondisi Kulit',
        href: '/admin/recommendations',
        icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
      },
      {
        name: 'Master Akun',
        href: '/admin/accounts',
        icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
      },
    ],
  };

  return (
    <div className="admin-root flex min-h-screen">
      <AdminSidebar
        navItems={navItems}
        masterGroup={masterGroup}
      />

      {/* Main Content */}
      <div className="flex-1 ml-60 flex flex-col min-w-0">
        {/* Gradient Accent Strip */}
        <div className="admin-header-accent" />

        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-6 sticky top-0 z-10"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-soft)'
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center text-sm">
            <span className="font-semibold" style={{ color: 'var(--text-main)' }}>Admin Console</span>
            <svg className="w-4 h-4 mx-2" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span style={{ color: 'var(--text-muted)' }}>Overview</span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</span>
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="text-sm font-medium px-3 py-1 rounded hover:opacity-80"
                style={{ color: 'var(--primary)' }}
              >
                Keluar
              </button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto admin-page-enter" style={{ backgroundColor: 'var(--bg-main)' }}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
