'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { GenericLoading } from './GenericLoading';
import { ProfilePhoto } from './ui/ProfilePhoto';

interface User {
  id: string;
  username: string | null;
  name: string | null;
  email: string | null;
  profilePhoto: string | null;
  isAdmin: boolean;
  _count: {
    post: number;
    comments: number;
    followers: number;
    following: number;
  };
}

interface AdminUserListProps {
  searchQuery: string;
  onUserSelect: (userId: string) => void;
  selectedUserId: string | null;
}

export function AdminUserList({ searchQuery, onUserSelect, selectedUserId }: AdminUserListProps) {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', searchQuery, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json() as Promise<{ users: User[]; total: number; limit: number; offset: number }>;
    },
    enabled: true,
  });

  if (isLoading) return <GenericLoading>Loading users...</GenericLoading>;
  if (error) return <div className="text-destructive">Error loading users</div>;

  const users = data?.users || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-2">
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {users.length} of {total} users
      </div>
      <div className="max-h-[600px] space-y-2 overflow-y-auto">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onUserSelect(user.id)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              selectedUserId === user.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/50'
            }`}>
            <div className="flex items-center gap-3">
              <ProfilePhoto
                name={user.name || user.username || 'User'}
                username={user.username || user.id}
                photoUrl={user.profilePhoto}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{user.name || user.username || 'No name'}</p>
                  {user.isAdmin && <span className="rounded bg-brand-red px-2 py-0.5 text-xs text-white">Admin</span>}
                </div>
                <p className="truncate text-sm text-muted-foreground">@{user.username || user.id}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span>{user._count.post} posts</span>
                  <span>{user._count.comments} comments</span>
                  <span>{user._count.followers} followers</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          isDisabled={offset === 0}
          className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary-accent disabled:cursor-not-allowed disabled:opacity-50">
          Previous
        </button>
        <button
          onClick={() => setOffset(offset + limit)}
          isDisabled={offset + limit >= total}
          className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary-accent disabled:cursor-not-allowed disabled:opacity-50">
          Next
        </button>
      </div>
    </div>
  );
}
