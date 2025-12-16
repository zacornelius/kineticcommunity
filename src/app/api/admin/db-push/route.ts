import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin/isAdmin';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/db-push
 * Run prisma db push to sync schema with database (admin only)
 */
export async function POST() {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Running prisma db push...');
    
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss --skip-generate');
    
    console.log('Prisma db push output:', stdout);
    if (stderr) console.error('Prisma db push errors:', stderr);

    return NextResponse.json({
      success: true,
      message: 'Database schema synced successfully',
      output: stdout,
    });
  } catch (error) {
    console.error('Error running db push:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync database schema',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

