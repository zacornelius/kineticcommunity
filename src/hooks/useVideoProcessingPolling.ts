import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GetPost } from '@/types/definitions';

/**
 * Polls for video processing status updates and refreshes posts when videos complete
 */
export function useVideoProcessingPolling() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Get all cached posts
      const cache = queryClient.getQueryCache();
      const postQueries = cache.findAll({ queryKey: ['posts'] });

      for (const query of postQueries) {
        const post = query.state.data as GetPost | undefined;
        if (!post) continue;

        // Check if this post has any videos that are processing
        const hasProcessingVideos = post.visualMedia?.some(
          (media) => media.processingStatus === 'PROCESSING' || media.processingStatus === 'PENDING'
        );

        if (hasProcessingVideos) {
          // Refetch this specific post to get updated status
          queryClient.invalidateQueries({ queryKey: ['posts', post.id] });
        }
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [queryClient]);
}

