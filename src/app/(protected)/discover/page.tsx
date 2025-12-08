import { DiscoverFilters } from '@/components/DiscoverFilters';
import { DiscoverProfiles } from '@/components/DiscoverProfiles';
import { DiscoverSearch } from '@/components/DiscoverSearch';
import { PageHeader } from '@/components/PageHeader';

export const metadata = {
  title: 'Munia | Discover',
};

export default async function Discover() {
  return (
    <div className="px-4 pt-4">
      <PageHeader>
        <h1 className="text-4xl font-bold">Discover</h1>
      </PageHeader>
      <DiscoverSearch />
      <DiscoverFilters />
      <DiscoverProfiles />
    </div>
  );
}
