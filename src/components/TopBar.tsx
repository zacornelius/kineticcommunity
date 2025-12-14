'use client';

import { ActionsPlus, NotificationBell } from '@/svg_components';
import { useCreatePostModal } from '@/hooks/useCreatePostModal';
import { useNotificationsCountQuery } from '@/hooks/queries/useNotificationsCountQuery';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { launchCreatePost } = useCreatePostModal();
  const { data: notificationCount } = useNotificationsCountQuery();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleCreatePost = () => {
    launchCreatePost({});
  };

  return (
    <div
      className={`fixed top-0 z-[3] flex w-full items-center justify-between bg-background/95 px-4 py-3 shadow backdrop-blur-sm transition-transform duration-300 md:hidden ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
      {/* Left: Create button */}
      <button
        onClick={handleCreatePost}
        className="flex items-center justify-center text-primary"
        aria-label="Create post">
        <ActionsPlus className="h-7 w-7" stroke="currentColor" />
      </button>

      {/* Center: Page title */}
      <h1 className="text-xl font-bold">{title || ''}</h1>

      {/* Right: Notifications */}
      <Link
        href="/notifications"
        className="relative flex items-center justify-center"
        aria-label="Notifications">
        <NotificationBell className="h-7 w-7" stroke="currentColor" />
        {notificationCount !== undefined && notificationCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </Link>
    </div>
  );
}

