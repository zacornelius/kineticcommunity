-- Add missing columns to production database

-- Add isAnnouncement to Post table
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "isAnnouncement" BOOLEAN NOT NULL DEFAULT false;

-- Add thumbnailUrl to VisualMedia table (if not exists)
-- Note: thumbnailUrl was added in an earlier migration but might not be deployed
ALTER TABLE "VisualMedia" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;

