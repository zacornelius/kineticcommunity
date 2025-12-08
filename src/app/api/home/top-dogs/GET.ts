/**
 * GET /api/home/top-dogs
 * Get top users with most posts
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { includeToUser } from '@/lib/prisma/includeToUser';
import { toGetUser } from '@/lib/prisma/toGetUser';
import { getServerUser } from '@/lib/getServerUser';

export async function GET() {
  try {
    const [userSession] = await getServerUser(); // Get current user session for `isFollowing` logic

    // Get all users with their post counts
    const allUsers = await prisma.user.findMany({
      where: {
        username: {
          not: null,
        },
      },
      select: {
        id: true,
        _count: {
          select: {
            post: true,
          },
        },
      },
    });

    // Sort by post count and get top 10 user IDs
    const topUserIds = allUsers
      .sort((a, b) => b._count.post - a._count.post)
      .slice(0, 10)
      .map((user) => user.id);

    if (topUserIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch full user data for top users
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: topUserIds,
        },
      },
      include: {
        followers: {
          where: {
            followerId: userSession?.id,
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            post: true,
          },
        },
      },
    });

    // Create a map of post counts for sorting
    const postCountMap = new Map(allUsers.map((u) => [u.id, u._count.post]));

    // Sort users by post count and convert to GetUser format
    const sortedUsers = users.sort((a, b) => (postCountMap.get(b.id) || 0) - (postCountMap.get(a.id) || 0));

    const topUsers = sortedUsers.map((user) => ({
      ...toGetUser(user),
      postCount: user._count.post,
    }));

    return NextResponse.json(topUsers);
  } catch (error) {
    console.error('Error in GET /api/home/top-dogs:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

