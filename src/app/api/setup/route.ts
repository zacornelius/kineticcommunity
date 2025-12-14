import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';

// ONE-TIME SETUP ENDPOINT - Run migrations and set master admin
export async function POST() {
  try {
    console.log('Running one-time setup...');
    
    // 1. Add missing columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "isAnnouncement" BOOLEAN NOT NULL DEFAULT false;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "VisualMedia" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
    `);
    
    // 2. Create AnnouncementDismissal table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AnnouncementDismissal" (
        "userId" TEXT NOT NULL,
        "postId" INTEGER NOT NULL,
        "dismissedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT "AnnouncementDismissal_pkey" PRIMARY KEY ("userId","postId"),
        CONSTRAINT "AnnouncementDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "AnnouncementDismissal_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log('✓ AnnouncementDismissal table created');
    console.log('✓ AnnouncementDismissal table created');
    
    // 3. Update master admin email
    const user = await prisma.user.update({
      where: { username: 'zacornelius' },
      data: { 
        isAdmin: true,
        email: 'zac@kineticdogfood.com'
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Setup complete!',
      user: { username: user.username, email: user.email, isAdmin: user.isAdmin }
    });
  } catch (error) {
    console.error('Setup failed:', error);
    return NextResponse.json(
      { error: 'Setup failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

