import { getServerUser } from '@/lib/getServerUser';
import { AdminDashboard } from '@/components/AdminDashboard';
import { isAdmin } from '@/lib/admin/isAdmin';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Admin Dashboard | Kinetic Community',
};

export default async function AdminPage() {
  const [user] = await getServerUser();
  if (!user) {
    redirect('/login');
  }

  const adminStatus = await isAdmin();
  if (!adminStatus) {
    redirect('/feed');
  }

  return (
    <div className="px-4 pt-4">
      <PageHeader>
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
      </PageHeader>
      <AdminDashboard />
    </div>
  );
}

