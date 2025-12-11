import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin/isAdmin';
import prisma from '@/lib/prisma/prisma';

/**
 * GET /api/admin/push/users
 * Get list of users with push subscriptions (admin only)
 */
export async function GET() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    console.log('Fetching push subscriptions...');
    // Get all users with push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`Found ${subscriptions.length} push subscriptions`);

    // Group by user and count subscriptions
    const userMap = new Map<
      string,
      {
        user: {
          id: string;
          username: string | null;
          name: string | null;
          email: string | null;
          profilePhoto: string | null;
        };
        subscriptionCount: number;
        lastSubscription: Date;
      }
    >();

    subscriptions.forEach((sub) => {
      // Skip if user is null (orphaned subscription)
      if (!sub.user) {
        console.warn(`Skipping subscription ${sub.id} - user not found`);
        return;
      }

      const existing = userMap.get(sub.userId);
      if (existing) {
        existing.subscriptionCount++;
        if (sub.createdAt > existing.lastSubscription) {
          existing.lastSubscription = sub.createdAt;
        }
      } else {
        userMap.set(sub.userId, {
          user: sub.user,
          subscriptionCount: 1,
          lastSubscription: sub.createdAt,
        });
      }
    });

    const users = Array.from(userMap.values()).map((item) => ({
      ...item,
      lastSubscription: item.lastSubscription.toISOString(),
    }));

    return NextResponse.json({
      users,
      total: users.length,
      totalSubscriptions: subscriptions.length,
    });
  } catch (error) {
    console.error('Error fetching push users:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
