export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

/**
 * POST /api/push/subscribe
 * Subscribe a user to push notifications
 */
export async function POST(request: Request) {
  const [user] = await getServerUser();
  if (!user) {
    console.log('[Push Subscribe] Unauthorized - no user');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { endpoint, keys } = body;

    console.log(`[Push Subscribe] User ${user.id} (${user.email}) subscribing`);
    console.log(`[Push Subscribe] Endpoint: ${endpoint?.substring(0, 50)}...`);

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      console.log('[Push Subscribe] Invalid subscription data');
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existing) {
      console.log('[Push Subscribe] Updating existing subscription');
      // Update existing subscription
      await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          p256dh: keys.p256dh,
          auth: keys.auth,
          userId: user.id,
        },
      });
    } else {
      console.log('[Push Subscribe] Creating new subscription');
      // Create new subscription
      await prisma.pushSubscription.create({
        data: {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userId: user.id,
        },
      });
    }

    console.log('[Push Subscribe] Successfully subscribed');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
