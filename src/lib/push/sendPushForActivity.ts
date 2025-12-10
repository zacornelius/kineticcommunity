import 'server-only';
import prisma from '@/lib/prisma/prisma';
import { sendPushNotification, formatNotificationForActivity } from './sendPushNotification';
import { ActivityType } from '@prisma/client';

/**
 * Send push notification when an activity is created
 * This should be called after creating an activity
 */
export async function sendPushForActivity(activityId: number): Promise<void> {
  try {
    // Get the activity with user information
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        sourceUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!activity || !activity.isNotificationActive) {
      return; // Activity doesn't exist or notifications are disabled
    }

    // Don't send notification if user is notifying themselves
    if (activity.sourceUserId === activity.targetUserId) {
      return;
    }

    const sourceUserName = activity.sourceUser.name || activity.sourceUser.username || 'Someone';
    const targetUserId = activity.targetUserId;

    // Get content for the notification (post/comment content)
    let content: string | undefined;
    if (activity.type === 'POST_LIKE' || activity.type === 'POST_MENTION' || activity.type === 'CREATE_COMMENT') {
      if (activity.targetId) {
        const post = await prisma.post.findUnique({
          where: { id: activity.targetId },
          select: { content: true },
        });
        content = post?.content || undefined;
      }
    } else if (
      activity.type === 'COMMENT_LIKE' ||
      activity.type === 'COMMENT_MENTION' ||
      activity.type === 'CREATE_REPLY' ||
      activity.type === 'REPLY_LIKE' ||
      activity.type === 'REPLY_MENTION'
    ) {
      if (activity.sourceId) {
        const comment = await prisma.comment.findUnique({
          where: { id: activity.sourceId },
          select: { content: true },
        });
        content = comment?.content || undefined;
      }
    }

    // Format notification
    const notification = formatNotificationForActivity(activity.type, sourceUserName, content);

    // Send push notification
    await sendPushNotification(targetUserId, {
      ...notification,
      icon: '/logo.png',
      data: {
        type: activity.type,
        sourceId: activity.sourceId,
        targetId: activity.targetId || undefined,
        sourceUsername: activity.sourceUser.username || undefined,
        targetUsername: activity.targetUser.username || undefined,
        url:
          activity.type === 'POST_LIKE' || activity.type === 'CREATE_COMMENT'
            ? `/posts/${activity.targetId}`
            : activity.type === 'CREATE_FOLLOW'
            ? `/${activity.sourceUser.username}`
            : activity.type === 'COMMENT_LIKE' || activity.type === 'CREATE_REPLY'
            ? `/comments/${activity.targetId || activity.sourceId}`
            : '/notifications',
      },
    });
  } catch (error) {
    console.error('Error sending push notification for activity:', error);
    // Don't throw - push notifications are non-critical
  }
}

