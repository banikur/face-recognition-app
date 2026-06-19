import { redirect } from 'next/navigation';

// /admin/dashboard is deprecated — redirect to /admin
export default function AdminDashboardRedirect() {
  redirect('/admin');
}
