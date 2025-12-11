'use client';

import { useQuery } from '@tanstack/react-query';
import { GenericLoading } from './GenericLoading';
import { Post } from './Post';
import { Delete } from '@/svg_components';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface AdminUserContentProps {
  userId: string;
}

export function AdminUserContent({ userId }: AdminUserContentProps) {
  const [deletedPostIds, setDeletedPostIds] = useState<Set<number>>(new Set());
  const [commentsShown, setCommentsShown] = useState<Record<number, boolean>>({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-user-content', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/content`);
      if (!res.ok) throw new Error('Failed to fetch user content');
      return res.json();
    },
  });

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');
      setDeletedPostIds((prev) => new Set([...prev, postId]));
      refetch();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleDownloadContent = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/content`);
      if (!res.ok) throw new Error('Failed to fetch content');
      const content = await res.json();

      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-${userId}-content-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading content:', error);
      alert('Failed to download content');
    }
  };

  if (isLoading) return <GenericLoading>Loading user content...</GenericLoading>;
  if (error) return <div className="text-destructive">Error loading user content</div>;

  const { user, posts, comments, visualMedia, stats } = data || {};

  if (!user) return <div>User not found</div>;

  const visiblePosts = posts?.filter((post: any) => !deletedPostIds.has(post.id)) || [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">{user.name || user.username || 'User'}</h3>
          <button
            onClick={handleDownloadContent}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-accent">
            Download Content
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Posts</p>
            <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Comments</p>
            <p className="text-2xl font-bold">{stats?.totalComments || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Media</p>
            <p className="text-2xl font-bold">{stats?.totalVisualMedia || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Likes</p>
            <p className="text-2xl font-bold">{stats?.totalLikes || 0}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-lg font-semibold">Posts</h4>
        <div className="max-h-[600px] space-y-4 overflow-y-auto">
          {visiblePosts.length === 0 ? (
            <p className="text-muted-foreground">No posts found</p>
          ) : (
            visiblePosts.map((post: any) => (
              <div key={post.id} className="relative">
                <Post
                  id={post.id}
                  commentsShown={commentsShown[post.id] || false}
                  toggleComments={(postId: number) => {
                    setCommentsShown((prev) => ({
                      ...prev,
                      [postId]: !prev[postId],
                    }));
                  }}
                />
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="absolute right-2 top-2 z-10 rounded-lg bg-destructive p-2 text-destructive-foreground hover:bg-destructive/80">
                  <Delete className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
