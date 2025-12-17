import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { isAdmin } from '@/lib/admin/isAdmin';
import { getServerUser } from '@/lib/getServerUser';
import { fileNameToUrl } from '@/lib/s3/fileNameToUrl';

export const dynamic = 'force-dynamic';

/**
 * POST /api/announcements
 * Create a new announcement post (admin only)
 */
export async function POST(request: Request) {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const content = formData.get('content') as string;
    const files = formData.getAll('files') as File[];

    if (!content && files.length === 0) {
      return NextResponse.json(
        { error: 'Content or media is required' },
        { status: 400 }
      );
    }

    // Import savePostFiles dynamically to avoid circular dependencies
    const { savePostFiles } = await import('@/lib/s3/savePostFiles');
    const savedFiles = files.length > 0 ? await savePostFiles(files as any) : [];

    const post = await prisma.post.create({
      data: {
        content,
        isAnnouncement: true,
        userId: user.id,
        ...(savedFiles.length > 0 && {
          visualMedia: {
            create: savedFiles.map((savedFile) => ({
              type: savedFile.type,
              fileName: savedFile.fileName,
              mimeType: savedFile.mimeType,
              processingStatus: savedFile.processingStatus,
              originalFileName: savedFile.originalFileName,
              thumbnailUrl: savedFile.thumbnailUrl,
              userId: user.id,
            })),
          },
        }),
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
          },
        },
        visualMedia: true,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/announcements
 * Get all announcement posts that haven't been dismissed by the current user
 */
export async function GET() {
  try {
    const [user] = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: {
        isAnnouncement: true,
        dismissals: {
          none: {
            userId: user.id,
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
            image: true,
          },
        },
        visualMedia: true,
        _count: {
          select: {
            postLikes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 most recent
    });

    // Transform visualMedia to include full URLs instead of just fileName
    const transformedPosts = posts.map(post => ({
      ...post,
      visualMedia: post.visualMedia.map(media => ({
        type: media.type,
        url: fileNameToUrl(media.fileName) as string,
        mimeType: media.mimeType,
        thumbnailUrl: media.thumbnailUrl ? fileNameToUrl(media.thumbnailUrl) : null,
        processingStatus: media.processingStatus,
      })),
    }));

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

