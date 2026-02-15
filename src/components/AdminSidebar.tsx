'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  name: string;
  href: string;
  icon: string;
};

export default function AdminSidebar({
  navItems,
  masterDataItems,
  transactionalItems,
}: {
  navItems: NavItem[];
  masterDataItems: NavItem[];
  transactionalItems: NavItem[];
}) {
  const pathname = usePathname();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        className={`admin-nav-item ${isActive ? 'active' : ''}`}
      >
        <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
        </svg>
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-10"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-soft)',
        boxShadow: '2px 0 12px rgba(0,0,0,0.04)'
      }}
    >
      {/* Logo/Brand */}
      <div
        className="h-16 flex items-center px-5"
        style={{
          borderBottom: '1px solid var(--border-soft)',
          background: 'linear-gradient(135deg, rgba(14,165,233,0.04) 0%, rgba(251,146,60,0.04) 100%)'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: 'var(--gradient-metric)' }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold block" style={{ color: 'var(--text-main)' }}>
              SkinLab
            </span>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        <p className="admin-nav-section-title">Master Data</p>
        <div className="space-y-1">
          {masterDataItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>

        <p className="admin-nav-section-title">Transactional</p>
        <div className="space-y-1">
          {transactionalItems.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div
        className="p-3"
        style={{
          borderTop: '1px solid var(--border-soft)',
          background: 'var(--bg-sidebar)'
        }}
      >
        <Link
          href="/"
          className="admin-nav-item"
        >
          <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span>User Portal</span>
        </Link>
      </div>
    </aside>
  );
}
