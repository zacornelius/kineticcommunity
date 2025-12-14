-- AlterTable
ALTER TABLE "Post" ADD COLUMN "isAnnouncement" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AnnouncementDismissal" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementDismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementDismissal_userId_idx" ON "AnnouncementDismissal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementDismissal_postId_userId_key" ON "AnnouncementDismissal"("postId", "userId");

-- CreateIndex
CREATE INDEX "Post_isAnnouncement_createdAt_idx" ON "Post"("isAnnouncement", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AnnouncementDismissal" ADD CONSTRAINT "AnnouncementDismissal_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementDismissal" ADD CONSTRAINT "AnnouncementDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

