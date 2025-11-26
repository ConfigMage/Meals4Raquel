import { redirect } from 'next/navigation';
import { checkAdminAuth } from '@/lib/auth';
import AdminDashboard from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const isAuthenticated = await checkAdminAuth();

  if (!isAuthenticated) {
    redirect('/admin');
  }

  return <AdminDashboard />;
}
