import { getServerUser } from '@/lib/getServerUser';
import { redirect } from 'next/navigation';
import { AdminPanel } from './AdminPanel';
import { isAdmin } from '@/lib/admin/isAdmin';

export async function generateMetadata({ params }: { params: { username: string } }) {
  return {
    title: `Admin - ${params.username}`,
  };
}

export default async function Page({ params }: { params: { username: string } }) {
  const [user] = await getServerUser();
  const userIsAdmin = await isAdmin();
  
  if (!userIsAdmin) {
    redirect(`/${params.username}`);
  }

  return (
    <div className="py-6">
      <AdminPanel userId={user!.id} />
    </div>
  );
}
