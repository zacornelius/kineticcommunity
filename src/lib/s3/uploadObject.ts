import 'server-only';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './s3Client';

export async function uploadObject(file: Buffer, fileName: string, type: string) {
  // For local development, check if we should skip S3 upload
  const isLocalDev = process.env.NODE_ENV === 'development';
  const hasDummyCredentials = process.env.S3_ACCESS_KEY_ID === 'dummy';
  
  if (isLocalDev && hasDummyCredentials) {
    console.warn(`[LOCAL DEV] Skipping S3 upload for ${fileName}. File would be uploaded to S3 in production.`);
    // In local dev, we'll just return - the fileName will be stored in DB but won't be accessible via URL
    return;
  }

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: type,
  });

  try {
    await s3Client.send(command);
    console.log(`✓ Successfully uploaded ${fileName} to S3`);
  } catch (error: unknown) {
    console.error('S3 Upload Error:', error);
    // Re-throw the error so the caller knows the upload failed
    // This prevents creating posts with files that don't exist
    if (error && typeof error === 'object' && 'name' in error && error.name === 'PermanentRedirect') {
      // The S3 client should handle redirects automatically, but if it doesn't,
      // we need to check the bucket configuration
      throw new Error(`S3 bucket redirect error. Please verify bucket name and region are correct. Bucket: ${process.env.S3_BUCKET_NAME}, Region: ${process.env.AWS_REGION}`);
    }
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
