import { VisualMediaType, VideoProcessingStatus } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { uploadObject } from '@/lib/s3/uploadObject';
import { Blob } from 'buffer';
import { transcodeVideo } from '@/lib/video/transcodeVideo';

// Map MIME types to proper file extensions
const mimeToExtension: Record<string, string> = {
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'image/jpeg': 'jpg',
};

/**
 * Use this function to efficiently save multiple files of a post.
 * If it encounters a `Blob`, it saves it to S3.
 * If it encounters a URL, it will return that URL instead of re-saving it.
 */
export async function savePostFiles(files: (Blob | string)[]) {
  // Create an array of promises
  const uploadPromises: Promise<{
    type: VisualMediaType;
    fileName: string;
    mimeType: string | null;
    thumbnailUrl?: string | null;
    processingStatus: VideoProcessingStatus | null;
    originalFileName: string | null;
  }>[] = files.map(async (file) => {
    if (typeof file === 'string') {
      // Return right away if given a URL
      const fileName = file.split('/').pop()!;
      const type: VisualMediaType = /\.(jpg|jpeg|png)$/i.test(fileName) ? 'PHOTO' : 'VIDEO';
      // For existing URLs, we don't have the MIME type, so set it to null
      return {
        type,
        fileName,
        mimeType: null,
        processingStatus: type === 'VIDEO' ? 'COMPLETED' : null,
        originalFileName: null,
      };
    }

    // If the item is Blob, save it to S3 and return the `type` and the `fileName`
    const type: VisualMediaType = file.type.startsWith('image/') ? 'PHOTO' : 'VIDEO';
    // Use the MIME type mapping if available, otherwise use the second part of the MIME type
    const fileExtension = mimeToExtension[file.type] || file.type.split('/')[1];
    const buffer = Buffer.from(await file.arrayBuffer());
    const baseFileName = `${Date.now()}-${uuid()}`;
    
    // For videos, upload to original/ folder and trigger transcoding
    if (type === 'VIDEO') {
      const originalFileName = `original/${baseFileName}.${fileExtension}`;
      const transcodedFileName = `${baseFileName}.mp4`;
      
      // Upload original to S3
      await uploadObject(buffer, originalFileName, file.type);
      
      // Trigger MediaConvert transcoding job
      try {
        await transcodeVideo({
          inputFileName: originalFileName,
          outputFileName: baseFileName,
        });
        
        console.log(`Transcoding started for ${originalFileName} -> ${transcodedFileName}`);
      } catch (error) {
        console.error('Failed to start transcoding:', error);
        // Still return the file info, but mark as FAILED
        return {
          type,
          fileName: transcodedFileName,
          mimeType: 'video/mp4',
          processingStatus: 'FAILED',
          originalFileName,
        };
      }
      
      // Return the transcoded file name (will be available after processing)
      return {
        type,
        fileName: transcodedFileName,
        mimeType: 'video/mp4',
        thumbnailUrl: `${baseFileName}_thumb.0000000.jpg`, // MediaConvert will generate this
        processingStatus: 'PROCESSING',
        originalFileName,
      };
    }
    
    // For photos, upload normally
    const fileName = `${baseFileName}.${fileExtension}`;
    await uploadObject(buffer, fileName, file.type);

    return {
      type,
      fileName,
      mimeType: file.type,
      processingStatus: null,
      originalFileName: null,
    };
  });

  // Wait for all promises to finish
  return Promise.all(uploadPromises);
}
