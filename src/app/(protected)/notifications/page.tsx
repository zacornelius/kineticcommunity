import { getServerUser } from '@/lib/getServerUser';
import { Notifications } from './Notifications';
import { TopBar } from '@/components/TopBar';
import { NotificationsHeader } from './NotificationsHeader';

export const metadata = {
  title: 'Munia | Notifications',
};

export default async function Page() {
  const [user] = await getServerUser();

  if (!user) return null;
  return (
    <>
      <TopBar title="Notifications" />
      <div className="px-4 pt-20 md:pt-4">
        <div className="mb-4 flex items-center justify-end md:justify-between">
          <h1 className="hidden text-4xl font-bold md:block">Notifications</h1>
          <NotificationsHeader />
        </div>
        <Notifications userId={user.id} />
      </div>
    </>
  );
}
