/**
 * GET /api/users/:userId/feed
 * - Allows an authenticated user to retrieve the most recent posts
 * from all users in the community (community mode - everyone sees everyone).
 */

import { usePostsSorter } from '@/hooks/usePostsSorter';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { selectPost } from '@/lib/prisma/selectPost';
import { toGetPost } from '@/lib/prisma/toGetPost';
import { NextResponse } from 'next/server';
import { GetPost } from '@/types/definitions';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const { filters, limitAndOrderBy } = usePostsSorter(request.url);

  const [user] = await getServerUser();
  if (!user || params.userId !== user.id) return NextResponse.json({}, { status: 401 });

  // Community mode: Show all posts from all users (not just followed users)
  // This creates a community feed where everyone sees everyone's posts
  const res = await prisma.post.findMany({
    where: {
      // Show all posts - no filtering by following
      ...filters,
    },
    ...limitAndOrderBy,
    select: selectPost(user.id),
  });

  const postsPromises = res.map(toGetPost);
  const posts = await Promise.all(postsPromises);

  return NextResponse.json<GetPost[]>(posts);
}
