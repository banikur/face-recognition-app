import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!session || !session.user || session.user.email !== adminEmail) {
    redirect('/');
  }
  const adminNavItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Products', href: '/admin/products' },
    { name: 'Skin Types', href: '/admin/skin-types' },
    { name: 'Ingredients', href: '/admin/ingredients' },
    { name: 'Rules', href: '/admin/rules' },
    { name: 'Reports', href: '/admin/reports' },
    { name: 'Export', href: '/admin/export' },
  ];

  return (
    <div className="vh-full bg-gray-50 overflow-hidden">
      <header className="bg-white">
        <div className="px-[1vh]">
          <div className="flex justify-between h-[6vh]">
            <div className="flex items-center">
              <a href="/admin" className="flex-shrink-0 flex items-center">
                <span className="text-sm font-bold text-gray-900">Admin Panel</span>
              </a>
              <nav className="ml-[1vh] flex gap-[1vh]">
                {adminNavItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-xs text-gray-600"
                  >
                    {item.name}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="px-[1vh] py-[1vh] text-xs font-medium text-gray-700"
              >
                User Portal
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="vh-full">
        {children}
      </main>
    </div>
  );
}
