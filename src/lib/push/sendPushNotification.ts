import 'server-only';
import webpush from 'web-push';
import prisma from '@/lib/prisma/prisma';
import { ActivityType } from '@prisma/client';

// Initialize web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:notifications@kineticcommunity.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  data?: {
    type: ActivityType;
    sourceId?: number;
    targetId?: number;
    sourceUsername?: string;
    targetUsername?: string;
    url?: string;
  };
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(userId: string, notification: PushNotificationData): Promise<void> {
  // Check if VAPID keys are configured
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured. Push notifications will not be sent.');
    return;
  }

  try {
    console.log(`[Push] Sending notification to user ${userId}:`, notification.title);
    
    // Get all push subscriptions for the user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    console.log(`[Push] Found ${subscriptions.length} subscriptions for user ${userId}`);

    if (subscriptions.length === 0) {
      console.log(`[Push] No subscriptions found for user ${userId}`);
      return; // User has no push subscriptions
    }

    // Send notification to all subscriptions
    const promises = subscriptions.map(async (subscription) => {
      try {
        console.log(`[Push] Sending to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(notification),
        );
        console.log(`[Push] Successfully sent to endpoint`);
      } catch (error: any) {
        console.error(`[Push] Error sending to endpoint:`, error.message, error.statusCode);
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[Push] Removing invalid subscription`);
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint },
          });
        }
      }
    });

    await Promise.allSettled(promises);
    console.log(`[Push] Finished sending notifications`);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
}

/**
 * Format notification based on activity type
 */
export function formatNotificationForActivity(
  type: ActivityType,
  sourceUserName: string,
  content?: string,
): Omit<PushNotificationData, 'data'> {
  const notifications: Record<ActivityType, { title: string; body: string }> = {
    CREATE_FOLLOW: {
      title: 'New Follower',
      body: `${sourceUserName} started following you!`,
    },
    POST_LIKE: {
      title: 'Post Liked',
      body: `${sourceUserName} liked your post${
        content ? `: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"` : ''
      }`,
    },
    POST_MENTION: {
      title: 'You were mentioned',
      body: `${sourceUserName} mentioned you in a post${
        content ? `: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"` : ''
      }`,
    },
    CREATE_COMMENT: {
      title: 'New Comment',
      body: `${sourceUserName} commented on your post${
        content ? `: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"` : ''
      }`,
    },
    COMMENT_LIKE: {
      title: 'Comment Liked',
      body: `${sourceUserName} liked your comment`,
    },
    COMMENT_MENTION: {
      title: 'You were mentioned',
      body: `${sourceUserName} mentioned you in a comment`,
    },
    CREATE_REPLY: {
      title: 'New Reply',
      body: `${sourceUserName} replied to your comment${
        content ? `: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"` : ''
      }`,
    },
    REPLY_LIKE: {
      title: 'Reply Liked',
      body: `${sourceUserName} liked your reply`,
    },
    REPLY_MENTION: {
      title: 'You were mentioned',
      body: `${sourceUserName} mentioned you in a reply`,
    },
  };

  return notifications[type] || { title: 'New Notification', body: 'You have a new notification' };
}
