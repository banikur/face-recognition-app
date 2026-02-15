import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/simple-auth';

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
  ];

  const masterDataItems = [
    {
      name: 'Brands',
      href: '/admin/brands',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
    {
      name: 'Categories',
      href: '/admin/categories',
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
    },
    {
      name: 'Ingredients',
      href: '/admin/ingredients',
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
    },
    {
      name: 'Recommendations',
      href: '/admin/recommendations',
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
    },
  ];

  const transactionalItems = [
    {
      name: 'Products',
      href: '/admin/products',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
  ];

  return (
    <div className="admin-root flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-10"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-soft)' }}
      >
        {/* Logo/Brand */}
        <div
          className="h-14 flex items-center px-4"
          style={{ borderBottom: '1px solid var(--border-soft)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--gradient-metric)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
              SkinLab Admin
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Main Nav */}
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="admin-nav-item group"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                {item.name}
              </Link>
            ))}
          </div>

          {/* Master Data Section */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Master Data
            </p>
            <div className="space-y-1">
              {masterDataItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="admin-nav-item group"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Transactional Section */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Transactional
            </p>
            <div className="space-y-1">
              {transactionalItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="admin-nav-item group"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border-soft)' }}>
          <Link
            href="/"
            className="admin-nav-item"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            User Portal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-56 flex flex-col min-w-0">
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
