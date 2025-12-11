import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { isAdmin } from '@/lib/admin/isAdmin';
import { deleteObject } from '@/lib/s3/deleteObject';

/**
 * DELETE /api/admin/posts/:postId
 * Delete a post as admin (admin only)
 */
export async function DELETE(request: Request, { params }: { params: { postId: string } }) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const postId = parseInt(params.postId, 10);

  try {
    // Get post with visual media before deleting
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        visualMedia: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete the post (this will cascade delete related data)
    await prisma.post.delete({
      where: { id: postId },
    });

    // Delete associated visual media files from S3
    const filenames = post.visualMedia.map((m) => m.fileName);
    await Promise.all(filenames.map(deleteObject));

    return NextResponse.json({ success: true, id: postId });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
