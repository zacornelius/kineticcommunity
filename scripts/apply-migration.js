// Script to apply missing database migrations
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration...');
  
  try {
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
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

