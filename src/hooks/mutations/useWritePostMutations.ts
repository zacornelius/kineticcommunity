import { InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';
import { chunk } from 'lodash';
import { useSession } from 'next-auth/react';
import { GetVisualMedia, GetPost, PostIds } from '@/types/definitions';
import { POSTS_PER_PAGE } from '@/constants';
import { revokeVisualMediaObjectUrls } from '@/lib/revokeVisualMediaObjectUrls';
import { useToast } from '../useToast';
import { useErrorNotifier } from '../useErrorNotifier';

export function useWritePostMutations({
  content,
  visualMedia,
  fileMap,
  exitCreatePostModal,
}: {
  content: string;
  visualMedia: GetVisualMedia[];
  fileMap?: Map<string, File>;
  exitCreatePostModal: () => void;
}) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const queryKey = ['users', session?.user?.id, 'posts'];
  const { showToast } = useToast();
  const { notifyError } = useErrorNotifier();

  const generateFormData = async (): Promise<FormData> => {
    const formData = new FormData();
    if (content) formData.append('content', content);

    const visualMediaFilesPromises = visualMedia.map(async ({ url }) => {
      if (url.startsWith('blob:')) {
        // Use the original File object if available (for proper filename and metadata)
        const originalFile = fileMap?.get(url);
        if (originalFile) {
          formData.append('files', originalFile);
        } else {
          // Fallback: fetch the blob (loses filename)
          const file = await fetch(url).then((r) => r.blob());
          formData.append('files', file);
        }
      } else {
        // If the url is a link, just append it to the formData
        formData.append('files', url);
      }
    });
    await Promise.all(visualMediaFilesPromises);

    return formData;
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      // Generate FormData first (before revoking blobs in onSuccess)
      const formData = await generateFormData();
      
      const res = await fetch(`/api/posts`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(res.statusText);
      // Return the created post to be used by callbacks.
      return (await res.json()) as GetPost;
    },
    onMutate: async () => {
      // Close modal immediately for better UX
      exitCreatePostModal();
      
      // Show optimistic toast
      showToast({ title: 'Posting...', type: 'success' });
      
      // Create an optimistic post with a temporary negative ID
      const optimisticId = -Date.now();
      const optimisticPost: GetPost = {
        id: optimisticId,
        content,
        createdAt: new Date(),
        isLiked: false,
        user: {
          id: session?.user?.id || '',
          username: session?.user?.name || '',
          name: session?.user?.name || '',
          profilePhoto: null,
        },
        visualMedia: visualMedia.map(vm => ({
          ...vm,
          processingStatus: vm.type === 'VIDEO' ? 'PROCESSING' : null,
        })),
        _count: {
          postLikes: 0,
          comments: 0,
        },
      };
      
      // Add optimistic post to cache
      qc.setQueryData(['posts', optimisticId], optimisticPost);
      
      // Add to feed
      qc.setQueriesData<InfiniteData<PostIds>>({ queryKey }, (oldData) => {
        if (!oldData) return oldData;
        
        const newPosts = [{ id: optimisticId, commentsShown: false }, ...(oldData?.pages ?? []).flat()];
        const newPages = chunk(newPosts, POSTS_PER_PAGE);
        
        return {
          pages: newPages,
          pageParams: [undefined, ...newPages.slice(0, -1).map((page) => page.at(-1)?.id)],
        };
      });
      
      return { optimisticId };
    },
    onSuccess: (createdPost, _, context) => {
      // Create a query for the created post
      qc.setQueryData(['posts', createdPost.id], createdPost);

      // Update the inifinite query of `PostIds` - replace optimistic post with real one
      qc.setQueriesData<InfiniteData<PostIds>>({ queryKey }, (oldData) => {
        if (!oldData) return oldData;

        // Flatten the old pages
        const flatPosts = oldData.pages.flat();
        
        // Replace the optimistic post (negative ID) with the real post
        const updatedPosts = flatPosts.map(post => 
          post.id === context?.optimisticId ? { id: createdPost.id, commentsShown: false } : post
        );

        // Chunk the updated posts
        const newPages = chunk(updatedPosts, POSTS_PER_PAGE);

        const newPageParams = [
          undefined,
          ...newPages.slice(0, -1).map((page) => page.at(-1)?.id),
        ];

        return {
          pages: newPages,
          pageParams: newPageParams,
        };
      });
      
      // Remove the optimistic post query and add the real one
      if (context?.optimisticId) {
        qc.removeQueries({ queryKey: ['posts', context.optimisticId] });
      }
      
      // Revoke blob URLs after successful upload
      revokeVisualMediaObjectUrls(visualMedia);
      
      // Show success toast
      showToast({ title: 'Posted!', type: 'success' });
    },
    onError: (err) => {
      // Revoke blob URLs on error too
      revokeVisualMediaObjectUrls(visualMedia);
      
      notifyError(err, 'Error Creating Post');
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: number }) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: await generateFormData(),
      });

      if (!res.ok) throw new Error(res.statusText);
      // Return the created post to be used by callbacks.
      return (await res.json()) as GetPost;
    },
    onSuccess: (updatedPost) => {
      // Update the query for the updated post
      qc.setQueryData(['posts', updatedPost.id], updatedPost);

      // Update the inifinite query of `PostIds` TODO: There might be no need for `setQueriesData`
      qc.setQueriesData<InfiniteData<PostIds>>({ queryKey }, (oldData) => {
        if (!oldData) return oldData;

        // Flatten the old pages first
        const oldPosts = oldData?.pages.flat();

        // Find the index of the updated post
        const index = oldPosts?.findIndex((post) => post.id === updatedPost.id);

        // Write the updated post
        oldPosts[index] = {
          id: updatedPost.id,
          commentsShown: false,
        };

        return {
          pages: chunk(oldPosts, POSTS_PER_PAGE),
          pageParams: oldData.pageParams,
        };
      });
      showToast({ title: 'Successfully Edited', type: 'success' });
      revokeVisualMediaObjectUrls(visualMedia);
      exitCreatePostModal();
    },
    onError: (err) => {
      notifyError(err, 'Error Creating Post');
    },
  });

  return { createPostMutation, updatePostMutation };
}
