'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'Manage Products',
      description: 'Add, edit, or remove face wash products',
      href: '/admin/products',
      icon: '🧴',
    },
    {
      title: 'Manage Skin Types',
      description: 'Configure different skin types',
      href: '/admin/skin-types',
      icon: '肤',
    },
    {
      title: 'Manage Ingredients',
      description: 'Manage product ingredients',
      href: '/admin/ingredients',
      icon: '🔬',
    },
    {
      title: 'Manage Rules',
      description: 'Configure recommendation rules',
      href: '/admin/rules',
      icon: '🧮',
    },
    {
      title: 'Analysis Reports',
      description: 'View analysis reports and statistics',
      href: '/admin/reports',
      icon: '📊',
    },
    {
      title: 'Export Data',
      description: 'Export analysis data to CSV/Excel',
      href: '/admin/export',
      icon: '📤',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your face recognition application</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
                <div className="mt-4 text-blue-600 font-medium">Manage →</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:text-gray-900 focus:outline-none"
          >
            ← Back to User Portal
          </button>
        </div>
      </div>
    </div>
  );
}