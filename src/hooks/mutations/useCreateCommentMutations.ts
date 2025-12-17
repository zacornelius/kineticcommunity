import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GetComment, GetPost } from '@/types/definitions';
import { useErrorNotifier } from '../useErrorNotifier';
import { useToast } from '../useToast';

export function useCreateCommentMutations() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const { notifyError } = useErrorNotifier();

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: number; content: string; parentId?: number }) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parentId,
        }),
      });

      if (!res.ok) throw new Error(res.statusText);
      return (await res.json()) as GetComment;
    },
    onSuccess: (createdComment) => {
      // Add comment to comments list
      qc.setQueryData<GetComment[]>(['posts', createdComment.postId, 'comments'], (oldComments) => {
        if (!oldComments) return oldComments;
        return [...oldComments, createdComment];
      });
      
      // Increment comment count on the post
      qc.setQueryData<GetPost>(['posts', createdComment.postId], (oldPost) => {
        if (!oldPost) return oldPost;
        return {
          ...oldPost,
          _count: {
            ...oldPost._count,
            comments: oldPost._count.comments + 1,
          },
        };
      });
      
      showToast({
        title: 'Success',
        message: 'Your comment has been created.',
        type: 'success',
      });
    },
    onError: (err) => {
      notifyError(err);
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async ({ parentId, content }: { parentId: number; content: string }) => {
      const res = await fetch(`/api/comments/${parentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!res.ok) throw new Error(res.statusText);
      return (await res.json()) as GetComment;
    },
    onSuccess: (createdReply) => {
      // Add reply to replies list
      qc.setQueryData<GetComment[]>(['comments', createdReply.parentId, 'replies'], (oldReplies) => {
        if (!oldReplies) return oldReplies;
        return [...oldReplies, createdReply];
      });
      
      // Increment reply count on the parent comment
      // We need to find the comment in the post's comments list
      const postId = createdReply.postId;
      qc.setQueryData<GetComment[]>(['posts', postId, 'comments'], (oldComments) => {
        if (!oldComments) return oldComments;
        return oldComments.map((comment) => {
          if (comment.id === createdReply.parentId) {
            return {
              ...comment,
              _count: {
                ...comment._count,
                replies: comment._count.replies + 1,
              },
            };
          }
          return comment;
        });
      });
      
      // Also increment total comment count on the post (replies count as comments)
      qc.setQueryData<GetPost>(['posts', postId], (oldPost) => {
        if (!oldPost) return oldPost;
        return {
          ...oldPost,
          _count: {
            ...oldPost._count,
            comments: oldPost._count.comments + 1,
          },
        };
      });
      
      showToast({
        title: 'Success',
        message: 'Your reply has been created.',
        type: 'success',
      });
    },
    onError: (err) => {
      notifyError(err);
    },
  });

  return {
    createCommentMutation,
    createReplyMutation,
  };
}
