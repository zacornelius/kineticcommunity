'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from '@/svg_components';

interface Announcement {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  createdBy: {
    name: string;
    username: string;
  };
}

export function Announcements() {
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      return res.json();
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (announcementId: number) => {
      const res = await fetch(`/api/announcements/${announcementId}/dismiss`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to dismiss');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  if (isLoading) return null;
  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Announcements</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="relative flex-shrink-0 w-80 rounded-lg border bg-card p-4 shadow-sm">
            <button
              onClick={() => dismissMutation.mutate(announcement.id)}
              className="absolute right-2 top-2 rounded-full p-1 hover:bg-muted"
              aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
            <h3 className="mb-2 pr-6 font-semibold">{announcement.title}</h3>
            <p className="mb-2 text-sm text-muted-foreground">{announcement.content}</p>
            <p className="text-xs text-muted-foreground">
              By {announcement.createdBy.name} •{' '}
              {new Date(announcement.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

