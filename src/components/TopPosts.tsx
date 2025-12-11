'use client';

import { useQuery } from '@tanstack/react-query';
import { Post } from './Post';
import { useState, useCallback } from 'react';
import { GenericLoading } from './GenericLoading';
import { GetPost } from '@/types/definitions';

export function TopPosts() {
  const [commentsShown, setCommentsShown] = useState<Record<number, boolean>>({});

  const toggleComments = useCallback((postId: number) => {
    setCommentsShown((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  }, []);

  const {
    data: posts,
    isLoading,
    error,
  } = useQuery<GetPost[]>({
    queryKey: ['top-posts'],
    queryFn: async () => {
      const res = await fetch('/api/home/top-posts');
      if (!res.ok) throw new Error('Failed to fetch top posts');
      return res.json();
    },
    staleTime: 60000 * 5, // Cache for 5 minutes
  });

  if (isLoading) return <GenericLoading>Loading top posts...</GenericLoading>;
  if (error) return <div className="text-destructive">Error loading top posts</div>;
  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-2 text-2xl font-bold">Top Posts</h2>
        <p className="text-muted-foreground">No posts found in the last 7 days.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-2xl font-bold">Top Posts</h2>
      <p className="mb-4 text-sm text-muted-foreground">Most liked posts in the last 7 days</p>
      <div className="space-y-4">
        {posts.map((post) => (
          <Post
            key={post.id}
            id={post.id}
            commentsShown={commentsShown[post.id] || false}
            toggleComments={toggleComments}
          />
        ))}
      </div>
    </div>
  );
}
