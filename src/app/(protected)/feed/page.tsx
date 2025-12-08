import { CreatePostModalLauncher } from '@/components/CreatePostModalLauncher';
import { Posts } from '@/components/Posts';
import { getServerUser } from '@/lib/getServerUser';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Munia | Feed',
};

export default async function Page() {
  const [user] = await getServerUser();
  return (
    <div className="px-4 pt-4">
      <PageHeader>
        <h1 className="text-4xl font-bold">Feed</h1>
      </PageHeader>
      <CreatePostModalLauncher />
      {user && <Posts type="feed" userId={user.id} />}
    </div>
  );
}
