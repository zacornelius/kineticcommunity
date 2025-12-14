import { TopDogs } from '@/components/TopDogs';
import { TopBar } from '@/components/TopBar';
import { Announcements } from '@/components/Announcements';

export const metadata = {
  title: 'Home | Kinetic Community',
};

export default async function HomePage() {
  return (
    <>
      <TopBar title="Home" />
      <div className="px-4 pt-20 md:pt-4">
        <div className="mt-6 space-y-8">
          <Announcements />
          <TopDogs />
        </div>
      </div>
    </>
  );
}
