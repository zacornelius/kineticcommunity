import { TopDogs } from '@/components/TopDogs';
import { CreatePostModalLauncher } from '@/components/CreatePostModalLauncher';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Home | Kinetic Community',
};

export default async function HomePage() {
  return (
    <div className="px-4 pt-4">
      <PageHeader>
        <h1 className="text-4xl font-bold">Home</h1>
      </PageHeader>
      <CreatePostModalLauncher />
      <div className="mt-6 space-y-8">
        <TopDogs />
      </div>
    </div>
  );
}

