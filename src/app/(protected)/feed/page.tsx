import { Posts } from '@/components/Posts';
import { getServerUser } from '@/lib/getServerUser';
import { TopBar } from '@/components/TopBar';

export const metadata = {
  title: 'Munia | Feed',
};

export default async function Page() {
  const [user] = await getServerUser();
  return (
    <>
      <TopBar title="Feed" />
      <div className="px-4 pt-20 md:pt-4">
        {user && <Posts type="feed" userId={user.id} />}
      </div>
    </>
  );
}
