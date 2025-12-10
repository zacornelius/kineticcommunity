import { getServerUser } from '@/lib/getServerUser';
import { getProfile } from '../../getProfile';
import { isAdmin } from '@/lib/admin/isAdmin';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/AdminDashboard';

export async function generateMetadata({ params }: { params: { username: string } }) {
  const profile = await getProfile(params.username);
  return {
    title: `Alerts | ${profile?.name}` || 'Alerts',
  };
}

export default async function Page({ params }: { params: { username: string } }) {
  const [user] = await getServerUser();
  if (!user) return <p>This is a protected page.</p>;
  const profile = await getProfile(params.username);
  const isOwn = user?.id === profile?.id;

  if (!isOwn) return <p>You have no access to this page.</p>;

  const adminStatus = await isAdmin();
  if (!adminStatus) {
    redirect(`/${params.username}`);
  }

  return (
    <div className="mt-4">
      <AdminDashboard />
    </div>
  );
}

