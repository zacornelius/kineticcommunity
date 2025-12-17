'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Close, ArrowChevronBack, ArrowChevronForward } from '@/svg_components';
import { VisualMediaType } from '@prisma/client';
import { useRef, useState } from 'react';

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
    url: string;
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
      setCurrentIndex(0); // Reset to first announcement
    },
  });

  const scrollToIndex = (index: number) => {
    if (scrollRef.current && announcements) {
      const cardWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: cardWidth * index,
        behavior: 'smooth',
      });
      setCurrentIndex(index);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (announcements && currentIndex < announcements.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  if (isLoading) return null;
  if (!announcements || announcements.length === 0) return null;

  const hasMultiple = announcements.length > 1;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Announcements
          {hasMultiple && (
            <span className="ml-2 text-sm font-normal text-muted-foreground whitespace-nowrap">
              {currentIndex + 1} of {announcements.length}
            </span>
          )}
        </h2>
        {hasMultiple && (
          <div className="flex gap-2">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="rounded-full p-2 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Previous announcement">
              <ArrowChevronBack className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === announcements.length - 1}
              className="rounded-full p-2 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Next announcement">
              <ArrowChevronForward className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        onScroll={(e) => {
          const scrollLeft = e.currentTarget.scrollLeft;
          const cardWidth = e.currentTarget.offsetWidth;
          const newIndex = Math.round(scrollLeft / cardWidth);
          if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
          }
        }}>
        {announcements.map((announcement, index) => (
          <div
            key={announcement.id}
            className="relative flex-shrink-0 w-full snap-start rounded-lg border border-border bg-background overflow-hidden">
            <button
              onClick={() => dismissMutation.mutate(announcement.id)}
              className="absolute right-2 top-2 z-10 rounded-full p-1.5 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg transition-colors"
              aria-label="Dismiss">
              <Close className="h-4 w-4" stroke="currentColor" strokeWidth={2} />
            </button>

            {announcement.visualMedia.length > 0 && (
              <div className="relative w-full h-48 sm:h-56 bg-muted">
                {announcement.visualMedia[0].type === 'PHOTO' ? (
                  <img
                    src={announcement.visualMedia[0].url}
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
                      announcement.visualMedia[0].thumbnailUrl || undefined
                    }>
                    <source
                      src={announcement.visualMedia[0].url}
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

