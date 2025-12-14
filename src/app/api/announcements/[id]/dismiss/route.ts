import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { getServerUser } from '@/lib/getServerUser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/announcements/[id]/dismiss
 * Dismiss an announcement post for the current user
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const postId = parseInt(params.id);
    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    await prisma.announcementDismissal.create({
      data: {
        postId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dismissing announcement:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss announcement' },
      { status: 500 }
    );
  }
}

