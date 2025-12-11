'use client';

import { GridFeedCards, NotificationBell, Search, Home } from '@/svg_components';
import { useNotificationsCountQuery } from '@/hooks/queries/useNotificationsCountQuery';
import Link from 'next/link';
import Image from 'next/image';
import { MenuBarItem } from './MenuBarItem';

export function MenuBar() {
  const { data: notificationCount } = useNotificationsCountQuery();

  return (
    <div className="fixed bottom-0 z-[2] flex w-full bg-background/70 shadow-inner backdrop-blur-sm md:sticky md:top-0 md:h-screen md:w-[212px] md:flex-col md:items-start md:bg-inherit md:p-4 md:shadow-none md:backdrop-blur-none">
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
        {
          title: 'Notifications',
          Icon: NotificationBell,
          route: '/notifications',
          badge: notificationCount,
          brandColor: 'brand-orange' as const,
        },
      ].map((item) => (
        <MenuBarItem key={item.title} {...item}>
          {item.title}
        </MenuBarItem>
      ))}
    </div>
  );
}
