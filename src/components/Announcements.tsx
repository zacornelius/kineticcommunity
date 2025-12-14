'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Close } from '@/svg_components';
import { VisualMediaType } from '@prisma/client';

interface AnnouncementPost {
  id: number;
  content: string;
  createdAt: string;
  user: {
    name: string;
    username: string;
    image: string;
  };
  visualMedia: {
    id: number;
    type: VisualMediaType;
    fileName: string;
    mimeType: string | null;
    processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
    thumbnailUrl: string | null;
  }[];
  _count: {
    postLikes: number;
    comments: number;
  };
}

export function Announcements() {
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useQuery<AnnouncementPost[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      return res.json();
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/announcements/${postId}/dismiss`, {
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
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-2xl font-bold">Announcements</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="relative flex-shrink-0 w-full sm:w-80 md:w-96 rounded-lg border border-border bg-background overflow-hidden">
            <button
              onClick={() => dismissMutation.mutate(announcement.id)}
              className="absolute right-2 top-2 z-10 rounded-full p-1.5 bg-background/90 hover:bg-muted backdrop-blur-sm border border-border shadow-sm"
              aria-label="Dismiss">
              <Close className="h-4 w-4" />
            </button>

            {announcement.visualMedia.length > 0 && (
              <div className="relative w-full h-48 sm:h-56 bg-muted">
                {announcement.visualMedia[0].type === 'PHOTO' ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_S3_BUCKET_URL}/${announcement.visualMedia[0].fileName}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : announcement.visualMedia[0].processingStatus === 'PROCESSING' ||
                  announcement.visualMedia[0].processingStatus === 'PENDING' ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center">
                      <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                      <p className="text-sm text-muted-foreground">Processing video...</p>
                    </div>
                  </div>
                ) : (
                  <video
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    poster={
                      announcement.visualMedia[0].thumbnailUrl
                        ? `${process.env.NEXT_PUBLIC_S3_BUCKET_URL}${announcement.visualMedia[0].thumbnailUrl}`
                        : undefined
                    }>
                    <source
                      src={`${process.env.NEXT_PUBLIC_S3_BUCKET_URL}/${announcement.visualMedia[0].fileName}`}
                      type={announcement.visualMedia[0].mimeType || 'video/mp4'}
                    />
                  </video>
                )}
              </div>
            )}

            <div className="p-4">
              {announcement.content && (
                <p className="mb-2 text-sm break-words">{announcement.content}</p>
              )}
              <p className="text-xs text-muted-foreground">
                By {announcement.user.name} •{' '}
                {new Date(announcement.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

