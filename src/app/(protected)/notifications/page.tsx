import { getServerUser } from '@/lib/getServerUser';
import { Notifications } from './Notifications';
import { PageHeader } from '@/components/PageHeader';
import { NotificationsHeader } from './NotificationsHeader';

export const metadata = {
  title: 'Munia | Notifications',
};

export default async function Page() {
  const [user] = await getServerUser();

  if (!user) return null;
  return (
    <div className="px-4 pt-4">
      <PageHeader action={<NotificationsHeader />}>
        <h1 className="text-4xl font-bold">Notifications</h1>
      </PageHeader>
      <Notifications userId={user.id} />
    </div>
  );
}
