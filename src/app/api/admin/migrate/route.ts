import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { isAdmin } from '@/lib/admin/isAdmin';

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting migration...');

    // Add isAnnouncement column to Post table
    console.log('Adding isAnnouncement column to Post table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "isAnnouncement" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('✓ isAnnouncement column added');

    // Add thumbnailUrl column to VisualMedia table (if not exists)
    console.log('Adding thumbnailUrl column to VisualMedia table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "VisualMedia" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
    `);
    console.log('✓ thumbnailUrl column added');

    console.log('Migration completed successfully!');

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully' 
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

