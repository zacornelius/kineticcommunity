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
    console.log('Received webhook payload:', JSON.stringify(body, null, 2));

    // Check if this is an EventBridge event or a manual call
    let fileName: string;
    let status: string;

    if (body.detail && body['detail-type'] === 'MediaConvert Job State Change') {
      // EventBridge payload structure
      const detail = body.detail;
      status = detail.status; // COMPLETE, ERROR, or CANCELED

      // Extract the output file path from the event
      const outputFilePath = detail.outputGroupDetails?.[0]?.outputDetails?.[0]?.outputFilePaths?.[0];
      
      if (!outputFilePath) {
        console.error('No output file path in EventBridge event:', body);
        return NextResponse.json({ error: 'No output file path found' }, { status: 400 });
      }

      // Extract fileName from S3 path: s3://bucket/filename.mp4 -> filename.mp4
      fileName = outputFilePath.split('/').pop() || '';
      console.log('Extracted from EventBridge:', { fileName, status });
    } else {
      // Manual call with simple structure
      fileName = body.fileName;
      status = body.status;
      
      if (!fileName) {
        return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
      }

      // If fileName doesn't have extension, add .mp4
      if (!fileName.endsWith('.mp4')) {
        fileName = `${fileName}.mp4`;
      }
      console.log('Manual call:', { fileName, status });
    }

    // Update all visual media with this fileName (should be one)
    const result = await prisma.visualMedia.updateMany({
      where: {
        fileName: fileName,
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

