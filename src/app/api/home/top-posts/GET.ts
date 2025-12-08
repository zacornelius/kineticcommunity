/**
 * GET /api/home/top-posts
 * Get top posts with most likes in the last 7 days
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { selectPost } from '@/lib/prisma/selectPost';
import { toGetPost } from '@/lib/prisma/toGetPost';
import { getServerUser } from '@/lib/getServerUser';

export async function GET() {
  const [user] = await getServerUser();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get all posts from the last 7 days with their like counts
  const allPosts = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      id: true,
      _count: {
        select: {
          postLikes: true,
        },
      },
    },
  });

  // Sort by like count and get top 10 post IDs
  const topPostIds = allPosts
    .sort((a, b) => b._count.postLikes - a._count.postLikes)
    .slice(0, 10)
    .map((post) => post.id);

  if (topPostIds.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch the full post data for the top posts
  const posts = await prisma.post.findMany({
    where: {
      id: {
        in: topPostIds,
      },
    },
    select: selectPost(user?.id),
  });

  // Convert to GetPost format
  const topPosts = await Promise.all(posts.map((post) => toGetPost(post)));

  // Sort again to maintain the order by likes
  topPosts.sort((a, b) => b._count.postLikes - a._count.postLikes);

  return NextResponse.json(topPosts);
}

