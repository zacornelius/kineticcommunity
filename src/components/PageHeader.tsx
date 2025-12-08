'use client';

import React from 'react';
import { useSessionUserData } from '@/hooks/useSessionUserData';
import Link from 'next/link';
import { ProfilePhoto } from './ui/ProfilePhoto';

export function PageHeader({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  const [user] = useSessionUserData();
  const username = user?.username || 'user-not-found';
  const profilePhoto = user?.profilePhoto;
  const name = user?.name || 'User';

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex-1">
        {children}
      </div>
      <div className="flex items-center gap-4">
        {action && <div>{action}</div>}
        <Link href={`/${username}`} className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full overflow-hidden">
            <ProfilePhoto
              name={name}
              username={username}
              photoUrl={profilePhoto}
              disableLink
            />
          </div>
        </Link>
      </div>
    </div>
  );
}

