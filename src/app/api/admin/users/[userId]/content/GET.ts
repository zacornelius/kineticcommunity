import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { isAdmin } from '@/lib/admin/isAdmin';

/**
 * GET /api/admin/users/:userId/content
 * Get all content for a specific user (admin only)
 * Includes posts, comments, and visual media
 */
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const userId = params.userId;

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      profilePhoto: true,
      coverPhoto: true,
      bio: true,
      website: true,
      address: true,
      phoneNumber: true,
      birthDate: true,
      gender: true,
      relationshipStatus: true,
      isAdmin: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get all posts with visual media
  const posts = await prisma.post.findMany({
    where: { userId },
    include: {
      visualMedia: true,
      postLikes: {
        select: {
          id: true,
          userId: true,
          createdAt: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePhoto: true,
            },
          },
          commentLikes: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get all comments (including replies)
  const allComments = await prisma.comment.findMany({
    where: { userId },
    include: {
      post: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          profilePhoto: true,
        },
      },
      commentLikes: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get all visual media
  const visualMedia = await prisma.visualMedia.findMany({
    where: { userId },
    include: {
      post: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: { uploadedAt: 'desc' },
  });

  return NextResponse.json({
    user,
    posts,
    comments: allComments,
    visualMedia,
    stats: {
      totalPosts: posts.length,
      totalComments: allComments.length,
      totalVisualMedia: visualMedia.length,
      totalLikes: posts.reduce((sum, post) => sum + post.postLikes.length, 0),
    },
  });
}

