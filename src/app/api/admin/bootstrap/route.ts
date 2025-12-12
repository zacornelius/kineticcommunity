import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/bootstrap
 * Bootstrap the first admin user (only works if no admins exist)
 * Body: { email: string } or { username: string }
 */
export async function POST(request: Request) {
  try {
    // Check if any admins already exist
    const existingAdminCount = await prisma.user.count({
      where: { isAdmin: true },
    });

    if (existingAdminCount > 0) {
      return NextResponse.json(
        { error: 'Admin users already exist. Use /api/admin/make-admin instead.' },
        { status: 403 }
      );
    }

    const { email, username } = await request.json();

    if (!email && !username) {
      return NextResponse.json({ error: 'email or username required' }, { status: 400 });
    }

    // Find and update the user
    const whereClause: any = {};
    if (email) whereClause.email = { contains: email, mode: 'insensitive' };
    if (username) whereClause.username = { contains: username, mode: 'insensitive' };

    const user = await prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
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
      message: 'First admin user created successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error bootstrapping admin:', error);
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
}

