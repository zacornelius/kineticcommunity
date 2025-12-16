import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/push/vapid-key
 * Returns the public VAPID key for push notifications
 */
export async function GET() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!vapidPublicKey) {
    return NextResponse.json({ error: 'VAPID key not configured' }, { status: 500 });
  }

  return NextResponse.json({ publicKey: vapidPublicKey });
}

