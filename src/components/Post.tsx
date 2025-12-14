'use client';

import { memo, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/cn';
import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import SvgComment from '@/svg_components/Comment';
import { AnimatePresence, motion } from 'framer-motion';
import { GetPost, PostId } from '@/types/definitions';
import { isEqual } from 'lodash';
import SvgHeart from '@/svg_components/Heart';
import { useQuery } from '@tanstack/react-query';
import { usePostLikesMutations } from '@/hooks/mutations/usePostLikesMutations';
import { ToggleStepper } from './ui/ToggleStepper';
import { Comments } from './Comments';
import { CommentSheet } from './CommentSheet';
import { PostVisualMediaContainer } from './PostVisualMediaContainer';
import ProfileBlock from './ProfileBlock';
import { HighlightedMentionsAndHashTags } from './HighlightedMentionsAndHashTags';
import { PostOptions } from './PostOptions';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Download, Delete as DeleteIcon } from '@/svg_components';
import { useDeletePostMutation } from '@/hooks/mutations/useDeletePostMutation';
import { useDialogs } from '@/hooks/useDialogs';
import Button from './ui/Button';

export const Post = memo(
  ({
    id: postId,
    commentsShown,
    toggleComments,
  }: PostId & {
    toggleComments: (postId: number) => void;
  }) => {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { likeMutation, unLikeMutation } = usePostLikesMutations({ postId });
    const { isAdmin } = useIsAdmin();
    const { deleteMutation } = useDeletePostMutation();
    const { confirm } = useDialogs();

    const { data, isPending, isError } = useQuery<GetPost>({
      queryKey: ['posts', postId],
      queryFn: async () => {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          throw new Error('Error getting post');
        }
        return (await res.json()) as GetPost;
      },
      staleTime: 60000 * 10,
    });

    const likePost = useCallback(() => likeMutation.mutate(), [likeMutation]);
    const unLikePost = useCallback(() => unLikeMutation.mutate(), [unLikeMutation]);
    const handleLikeToggle = useCallback(
      (isSelected: boolean) => {
        if (isSelected) {
          likePost();
        } else {
          unLikePost();
        }
      },
      [likePost, unLikePost],
    );
    const handleCommentsToggle = useCallback(() => {
      toggleComments(postId);
    }, [postId, toggleComments]);

    const handleDownloadPost = useCallback(() => {
      if (!data || !data.visualMedia || data.visualMedia.length === 0) {
        alert('This post has no media files to download');
        return;
      }

      // Download each media file
      data.visualMedia.forEach((media, index) => {
        const link = document.createElement('a');
        link.href = `/api/posts/${postId}/download?index=${index}`;
        // Extract filename from URL or use default based on type
        const urlParts = media.url.split('/');
        const urlFilename = urlParts[urlParts.length - 1]?.split('?')[0] || '';
        const defaultExt = media.type === 'VIDEO' ? '.mp4' : '.jpg';
        link.download = urlFilename || `media-${index + 1}${defaultExt}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Add a small delay between downloads to avoid browser blocking
        if (index < data.visualMedia.length - 1) {
          setTimeout(() => {}, 100);
        }
      });
    }, [postId, data]);

    const handleAdminDelete = useCallback(() => {
      confirm({
        title: 'Delete Post (Admin)',
        message: 'Do you really wish to delete this post as an admin?',
        onConfirm: () => {
          setTimeout(() => deleteMutation.mutate({ postId }), 300);
        },
      });
    }, [confirm, deleteMutation, postId]);
    const variants = useMemo(
      () => ({
        animate: {
          height: 'auto',
          overflow: 'visible',
        },
        exit: {
          height: 0,
          overflow: 'hidden',
        },
      }),
      [],
    );

    if (isPending) return <p>Loading...</p>;
    if (isError) return <p>Error loading post.</p>;
    if (!data) return <p>This post no longer exists.</p>;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { content, createdAt, user: author, visualMedia, isLiked, _count } = data;
    const isOwnPost = userId === author.id;
    const numberOfLikes = _count.postLikes;

    return (
      <div className="rounded-2xl bg-card px-4 shadow sm:px-8">
        <div className="flex items-center justify-between pt-4 sm:pt-5">
          <ProfileBlock
            name={author.name!}
            username={author.username!}
            time={formatDistanceStrict(new Date(createdAt), new Date())}
            photoUrl={author.profilePhoto!}
          />
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button onPress={handleDownloadPost} Icon={Download} mode="ghost" aria-label="Download post" />
                <Button onPress={handleAdminDelete} Icon={DeleteIcon} mode="ghost" aria-label="Delete post (admin)" />
              </>
            )}
            {isOwnPost && <PostOptions postId={postId} content={content} visualMedia={visualMedia} />}
          </div>
        </div>
        {content && (
          <p className="mb-4 mt-5 text-lg text-muted-foreground">
            <HighlightedMentionsAndHashTags text={content} shouldAddLinks />
          </p>
        )}
        {visualMedia.length > 0 && (
          <div className="mb-4 mt-5 overflow-hidden rounded-2xl">
            <PostVisualMediaContainer visualMedia={visualMedia} />
          </div>
        )}
        <div
          className={cn([
            'flex justify-start gap-2 border-y border-y-border py-2',
            !commentsShown && 'border-b-transparent',
          ])}>
          <ToggleStepper
            isSelected={isLiked}
            onChange={handleLikeToggle}
            Icon={SvgHeart}
            quantity={numberOfLikes}
            // noun="Like"
          />
          <ToggleStepper
            isSelected={commentsShown || false}
            onChange={handleCommentsToggle}
            Icon={SvgComment}
            quantity={_count.comments}
            color="blue"
            // noun="Comment"
          />
        </div>

        {/* Hide inline comments - now using modal */}
        {/* <AnimatePresence>
          {commentsShown && (
            <motion.div key={`${postId}-comments`} variants={variants} initial={false} animate="animate" exit="exit">
              <Comments postId={postId} />
            </motion.div>
          )}
        </AnimatePresence> */}

        {/* Instagram-style Comment Sheet */}
        <CommentSheet
          postId={postId}
          isOpen={commentsShown || false}
          onClose={() => toggleComments(postId)}
          commentCount={_count.comments}
        />
      </div>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps),
);

Post.displayName = 'Post';
