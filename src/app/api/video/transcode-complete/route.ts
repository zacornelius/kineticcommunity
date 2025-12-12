import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/video/transcode-complete
 * Called when MediaConvert job completes (via EventBridge webhook)
 * Or can be called manually to check status
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, status } = body; // fileName is the base name without extension

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    // Update all visual media with this fileName (should be one)
    const transcodedFileName = `${fileName}.mp4`;
    
    const result = await prisma.visualMedia.updateMany({
      where: {
        fileName: transcodedFileName,
        processingStatus: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
      data: {
        processingStatus: status === 'COMPLETE' ? 'COMPLETED' : 'FAILED',
      },
    });

    console.log(`Updated ${result.count} videos to ${status}`);

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error('Error updating transcode status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

/**
 * GET /api/video/transcode-complete?fileName=xxx
 * Check status of a specific video
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
  }

  const video = await prisma.visualMedia.findFirst({
    where: { fileName },
  });

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  }

  return NextResponse.json({
    fileName: video.fileName,
    processingStatus: video.processingStatus,
  });
}

