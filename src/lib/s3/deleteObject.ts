import 'server-only';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './s3Client';

export async function deleteObject(fileName: string) {
  // For local development, skip S3 deletion if using dummy credentials
  const isLocalDev = process.env.NODE_ENV === 'development';
  const hasDummyCredentials = process.env.S3_ACCESS_KEY_ID === 'dummy';
  
  if (isLocalDev && hasDummyCredentials) {
    console.warn(`[LOCAL DEV] Skipping S3 delete for ${fileName}.`);
    return;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);
  } catch (error) {
    // In development, log but don't fail if S3 delete fails
    // (file might not exist or bucket might not be accessible)
    if (isLocalDev) {
      console.warn(`[LOCAL DEV] S3 delete failed for ${fileName}, but continuing.`, error);
      return;
    }
    // In production, re-throw the error
    throw error;
  }
}
