import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin/isAdmin';
import { sendPushNotification } from '@/lib/push/sendPushNotification';
import prisma from '@/lib/prisma/prisma';
import { z } from 'zod';

const sendPushSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  url: z.string().optional(),
});

/**
 * POST /api/admin/push/send
 * Send a push notification to a user or all users (admin only)
 */
export async function POST(request: Request) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, title, body, url } = sendPushSchema.parse(body);

    if (userId) {
      // Send to specific user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await sendPushNotification(userId, {
        title,
        body,
        icon: '/logo.png',
        data: {
          url: url || '/',
        },
      });

      return NextResponse.json({
        success: true,
        message: `Push notification sent to ${user.name || user.username}`,
      });
    } else {
      // Send to all users with push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });

      const userIds = subscriptions.map((s) => s.userId);
      let successCount = 0;
      let errorCount = 0;

      // Send to all users (in batches to avoid overwhelming)
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map((id) =>
            sendPushNotification(id, {
              title,
              body,
              icon: '/logo.png',
              data: {
                url: url || '/',
              },
            })
          )
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            errorCount++;
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: `Push notifications sent to ${successCount} users${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
        sent: successCount,
        failed: errorCount,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }

    console.error('Error sending admin push notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

