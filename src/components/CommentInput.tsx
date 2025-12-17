'use client';

import { forwardRef, useCallback, useState } from 'react';
import { useCreateCommentMutations } from '@/hooks/mutations/useCreateCommentMutations';
import { ProfilePhotoOwn } from './ui/ProfilePhotoOwn';
import SvgSend from '@/svg_components/Send';

interface CommentInputProps {
  postId: number;
  parentId?: number;
  onSuccess?: () => void;
  placeholder?: string;
}

export const CommentInput = forwardRef<HTMLTextAreaElement, CommentInputProps>(
  ({ postId, parentId, onSuccess, placeholder = 'Add a comment...' }, ref) => {
    const [content, setContent] = useState('');
    const { createCommentMutation } = useCreateCommentMutations();

    const handleSubmit = useCallback(() => {
      if (!content.trim()) return;

      createCommentMutation.mutate(
        { postId, content, parentId },
        {
          onSuccess: () => {
            setContent('');
            onSuccess?.();
          },
        },
      );
    }, [content, createCommentMutation, postId, parentId, onSuccess]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (but not Shift+Enter for new lines)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    return (
      <div className="flex items-end gap-3 p-4">
        <div className="h-10 w-10 flex-shrink-0">
          <ProfilePhotoOwn />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-muted px-4 py-2">
          <textarea
            ref={ref}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            style={{
              maxHeight: '100px',
              minHeight: '24px',
            }}
          />
          <button
            onClick={handleSubmit}
            isDisabled={!content.trim() || createCommentMutation.isPending}
            className="flex-shrink-0 text-primary disabled:opacity-40"
            aria-label="Send comment">
            <SvgSend className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  },
);

CommentInput.displayName = 'CommentInput';

