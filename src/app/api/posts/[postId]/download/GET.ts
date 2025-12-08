/**
 * GET /api/posts/:postId/download
 * Download post media files from S3 (admin only)
 * Query param: index (optional) - which media file to download (0-based)
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { isAdmin } from '@/lib/admin/isAdmin';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3/s3Client';

export async function GET(request: Request, { params }: { params: { postId: string } }) {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const postId = parseInt(params.postId, 10);
  const { searchParams } = new URL(request.url);
  const mediaIndex = parseInt(searchParams.get('index') || '0', 10);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      visualMedia: {
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (post.visualMedia.length === 0) {
    return NextResponse.json({ error: 'No media files found for this post' }, { status: 404 });
  }

  if (mediaIndex < 0 || mediaIndex >= post.visualMedia.length) {
    return NextResponse.json({ error: 'Invalid media index' }, { status: 400 });
  }

  const media = post.visualMedia[mediaIndex];
  const fileName = media.fileName;

  try {
    // Fetch the file from S3
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return NextResponse.json({ error: 'File not found in S3' }, { status: 404 });
    }

    // Convert the stream to a buffer
    const chunks: Uint8Array[] = [];
    // @ts-expect-error - Body is a ReadableStream
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Determine content type from file extension
    const contentType = fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.webm')
      ? 'video/mp4'
      : fileName.endsWith('.png')
      ? 'image/png'
      : fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file from S3:', error);
    return NextResponse.json(
      { error: 'Failed to download file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

