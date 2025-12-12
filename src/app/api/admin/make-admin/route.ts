import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/make-admin
 * Make a user an admin (temporary endpoint for setup)
 */
export async function POST(request: Request) {
  try {
    const { email, username } = await request.json();

    if (!email && !username) {
      return NextResponse.json({ error: 'email or username required' }, { status: 400 });
    }

    const result = await prisma.user.updateMany({
      where: {
        OR: [
          email ? { email: { contains: email, mode: 'insensitive' } } : {},
          username ? { username: { contains: username, mode: 'insensitive' } } : {},
        ].filter((condition) => Object.keys(condition).length > 0),
      },
      data: {
        isAdmin: true,
      },
    });

    // Get the updated users
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

    return NextResponse.json({
      success: true,
      updated: result.count,
      adminUsers,
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

