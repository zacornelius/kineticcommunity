'use client';

import { useQuery } from '@tanstack/react-query';
import { GenericLoading } from './GenericLoading';
import { ProfilePhoto } from './ui/ProfilePhoto';
import Link from 'next/link';
import { GetUser } from '@/types/definitions';

interface TopDogUser extends GetUser {
  postCount: number;
  points: number;
}

export function TopDogs() {
  const { data: users, isLoading, error } = useQuery<TopDogUser[]>({
    queryKey: ['top-dogs'],
    queryFn: async () => {
      const res = await fetch('/api/home/top-dogs');
      if (!res.ok) throw new Error('Failed to fetch top users');
      return res.json();
    },
    staleTime: 60000 * 5, // Cache for 5 minutes
  });

  if (isLoading) return <GenericLoading>Loading top users...</GenericLoading>;
  if (error) return <div className="text-destructive">Error loading top users</div>;
  if (!users || users.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-2xl font-bold mb-2">Top Dogs</h2>
        <p className="text-muted-foreground">No users found.</p>
      </div>
    );
  }

  // Calculate points (10 points per post) and find max for bar scaling
  const usersWithPoints = users.map((user) => ({
    ...user,
    points: (user.postCount || 0) * 10,
  }));

  const maxPoints = Math.max(...usersWithPoints.map((u) => u.points), 1); // Avoid division by zero

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-2xl font-bold mb-4">Top Dogs</h2>
      <p className="text-sm text-muted-foreground mb-4">Most active community members</p>
      <div className="space-y-4">
        {usersWithPoints.map((user, index) => {
          const barWidth = (user.points / maxPoints) * 100;
          return (
            <Link
              key={user.id}
              href={`/${user.username}`}
              className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>
                </div>
                <div className="flex-shrink-0">
                  <ProfilePhoto
                    name={user.name}
                    username={user.username}
                    photoUrl={user.profilePhoto}
                    disableLink
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-sm font-bold">{user.points} pts</p>
                      <p className="text-xs text-muted-foreground">{user.postCount} posts</p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${barWidth}%` }}>
                      {barWidth > 15 && (
                        <span className="text-xs font-semibold text-primary-foreground">{user.points}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

