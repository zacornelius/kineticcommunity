import { DiscoverFilters } from '@/components/DiscoverFilters';
import { DiscoverProfiles } from '@/components/DiscoverProfiles';
import { DiscoverSearch } from '@/components/DiscoverSearch';
import { TopBar } from '@/components/TopBar';

export const metadata = {
  title: 'Munia | Discover',
};

export default async function Discover() {
  return (
    <>
      <TopBar title="Discover" />
      <div className="px-4 pt-20 md:pt-4">
        <DiscoverSearch />
        <DiscoverFilters />
        <DiscoverProfiles />
      </div>
    </>
  );
}
