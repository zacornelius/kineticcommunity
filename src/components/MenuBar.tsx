'use client';

import { GridFeedCards, Search, Home } from '@/svg_components';
import Link from 'next/link';
import Image from 'next/image';
import { MenuBarItem } from './MenuBarItem';
import { useSessionUserData } from '@/hooks/useSessionUserData';
import { ProfilePhoto } from './ui/ProfilePhoto';

export function MenuBar() {
  const [user] = useSessionUserData();
  const username = user?.username || 'profile';

  return (
    <div className="fixed bottom-0 z-[2] flex w-full items-center justify-around bg-background/70 shadow-inner backdrop-blur-sm md:sticky md:top-0 md:h-screen md:w-[212px] md:flex-col md:items-start md:justify-start md:bg-inherit md:p-4 md:shadow-none md:backdrop-blur-none">
      {/* Logo - Desktop only */}
      <Link href="/" title="Home" className="mb-4 hidden items-center gap-2 md:flex">
        <Image
          src="/logo.png"
          alt="Logo"
          width={327}
          height={39}
          className="h-4 w-auto"
          style={{ objectFit: 'contain' }}
        />
      </Link>

      {/* Bottom bar items (mobile) / Sidebar items (desktop) */}
      {[
        {
          title: 'Home',
          Icon: Home,
          route: '/home',
          brandColor: 'brand-blue' as const,
        },
        {
          title: 'Feed',
          Icon: GridFeedCards,
          route: '/feed',
          brandColor: 'brand-green' as const,
        },
        {
          title: 'Discover',
          Icon: Search,
          route: '/discover',
          brandColor: 'brand-green' as const,
        },
      ].map((item) => (
        <MenuBarItem key={item.title} {...item}>
          {item.title}
        </MenuBarItem>
      ))}

      {/* Profile with photo */}
      <Link
        href={`/${username}`}
        className="flex flex-col items-center justify-center p-3 md:w-full md:flex-row md:justify-start md:gap-3 md:rounded-lg md:hover:bg-muted">
        <div className="h-7 w-7 overflow-hidden rounded-full md:h-8 md:w-8">
          <ProfilePhoto
            name={user?.name || ''}
            username={username}
            photoUrl={user?.profilePhoto}
            disableLink
          />
        </div>
        <span className="mt-1 text-xs font-medium md:mt-0 md:text-base">Profile</span>
      </Link>
    </div>
  );
}
