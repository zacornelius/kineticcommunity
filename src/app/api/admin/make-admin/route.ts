import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// Master admin email that cannot be removed
const MASTER_ADMIN_EMAIL = 'zacornelius@gmail.com';

/**
 * POST /api/admin/make-admin
 * Add or remove admin privileges for a user
 * Body: { userId: string, isAdmin: boolean }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    // Check if requester is authenticated
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if requester is an admin
    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!requester?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userId, isAdmin } = await request.json();

    if (!userId || typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'userId (string) and isAdmin (boolean) are required' },
        { status: 400 }
      );
    }

    // Check if target user is the master admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent removing admin from master admin
    if (!isAdmin && targetUser.email === MASTER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Cannot remove admin privileges from master admin' },
        { status: 403 }
      );
    }

    // Prevent removing admin from yourself if you're the only admin
    if (!isAdmin && userId === session.user.id) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove admin from the only admin user' },
          { status: 400 }
        );
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating admin status:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

/**
 * GET /api/admin/make-admin
 * List all admin users (requires admin access)
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!requester?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        isAdmin: true,
      },
    });

    return NextResponse.json({ adminUsers });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Failed to fetch admin users' }, { status: 500 });
  }
}

