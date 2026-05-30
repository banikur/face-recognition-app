'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  name: string;
  href: string;
  icon: string;
};

type NavGroup = {
  label: string;
  icon: string;
  items: NavItem[];
};

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  // Exact match for /admin, prefix match for others
  const isActive =
    item.href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={`admin-nav-item ${isActive ? 'active' : ''}`}
    >
      <svg
        className="w-4 h-4 mr-3 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>
      <span>{item.name}</span>
    </Link>
  );
}

function NavGroup({ group }: { group: NavGroup }) {
  return (
    <div>
      <p className="admin-nav-section-title">{group.label}</p>
      <div className="space-y-0.5">
        {group.items.map(item => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function AdminSidebar({
  navItems,
  masterGroup,
  configGroup,
  // legacy props kept for backward compat
  masterDataItems,
  transactionalItems,
}: {
  navItems: NavItem[];
  masterGroup?: NavGroup;
  configGroup?: NavGroup;
  masterDataItems?: NavItem[];
  transactionalItems?: NavItem[];
}) {
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
              Face Analytic
            </span>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Admin Console
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {/* Top-level items (Dashboard, Laporan) */}
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Master Data group */}
        {masterGroup && (
          <div className="mt-3">
            <NavGroup group={masterGroup} />
          </div>
        )}

        {/* Config group (Rules, Rekomendasi, Akun) */}
        {configGroup && (
          <div className="mt-3">
            <NavGroup group={configGroup} />
          </div>
        )}

        {/* Legacy fallback */}
        {masterDataItems && masterDataItems.length > 0 && (
          <div className="mt-3">
            <p className="admin-nav-section-title">Master Data</p>
            <div className="space-y-0.5">
              {masterDataItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}
        {transactionalItems && transactionalItems.length > 0 && (
          <div className="mt-3">
            <p className="admin-nav-section-title">Transaksional</p>
            <div className="space-y-0.5">
              {transactionalItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        className="p-3"
        style={{ borderTop: '1px solid var(--border-soft)' }}
      >
        <Link href="/" className="admin-nav-item">
          <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Portal Pengguna</span>
        </Link>
      </div>
    </aside>
  );
}
