-- CreateEnum
CREATE TYPE "VideoProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "VisualMedia" ADD COLUMN     "originalFileName" TEXT,
ADD COLUMN     "processingStatus" "VideoProcessingStatus" DEFAULT 'PENDING';
