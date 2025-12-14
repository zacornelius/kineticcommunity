'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SvgClose from '@/svg_components/Close';
import { Comments } from './Comments';
import { CommentInput } from './CommentInput';

interface CommentSheetProps {
  postId: number;
  isOpen: boolean;
  onClose: () => void;
  commentCount: number;
}

export function CommentSheet({ postId, isOpen, onClose, commentCount }: CommentSheetProps) {
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; username: string } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      document.body.style.overflow = 'hidden';
      // On mobile, also lock the position to prevent iOS Safari bounce
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore scroll position when closing
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleBackdropClick}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative z-10 flex h-[85vh] w-full flex-col bg-background sm:h-[600px] sm:max-w-lg sm:rounded-t-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-lg font-semibold">
                Comments {commentCount > 0 && `(${commentCount})`}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="Close comments">
                <SvgClose className="h-6 w-6" />
              </button>
            </div>

            {/* Comments List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4">
              <Comments postId={postId} onReply={setReplyingTo} />
            </div>

            {/* Reply indicator */}
            {replyingTo && (
              <div className="flex items-center justify-between border-t border-border bg-muted px-4 py-2 text-sm">
                <span className="text-muted-foreground">
                  Replying to <span className="font-semibold">@{replyingTo.username}</span>
                </span>
                <button
                  onClick={handleCancelReply}
                  className="text-primary hover:text-primary/80"
                  aria-label="Cancel reply">
                  Cancel
                </button>
              </div>
            )}

            {/* Input - Fixed at bottom */}
            <div className="border-t border-border bg-background">
              <CommentInput
                ref={inputRef}
                postId={postId}
                parentId={replyingTo?.commentId}
                onSuccess={() => setReplyingTo(null)}
                placeholder={
                  replyingTo ? `Reply to @${replyingTo.username}...` : 'Add a comment...'
                }
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

