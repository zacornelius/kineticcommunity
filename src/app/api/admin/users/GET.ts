import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { isAdmin } from '@/lib/admin/isAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users
 * Search for users (admin only)
 * Query params: search (optional), limit (optional), offset (optional)
 */
export async function GET(request: Request) {
  try {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            post: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
      take: limit,
      skip: offset,
      // Order by id (descending) since User model doesn't have createdAt
      orderBy: { id: 'desc' },
    });

    // Map to only return the fields we need
    const usersResponse = users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto,
      isAdmin: user.isAdmin ?? false,
      _count: user._count,
    }));

    const total = await prisma.user.count({ where });

    return NextResponse.json({
      users: usersResponse,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
