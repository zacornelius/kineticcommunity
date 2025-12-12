import { getServerUser } from '@/lib/getServerUser';
import { redirect } from 'next/navigation';
import { AdminPanel } from './AdminPanel';

export async function generateMetadata({ params }: { params: { username: string } }) {
  return {
    title: `Admin - ${params.username}`,
  };
}

export default async function Page({ params }: { params: { username: string } }) {
  const [user] = await getServerUser();
  
  if (!user?.isAdmin) {
    redirect(`/${params.username}`);
  }

  return (
    <div className="py-6">
      <AdminPanel userId={user.id} />
    </div>
  );
}
