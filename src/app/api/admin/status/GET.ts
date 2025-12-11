import { NextResponse } from 'next/server';
import { getAdminStatus } from '@/lib/admin/isAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/status
 * Check if current user is an admin
 */
export async function GET() {
  try {
    console.log('GET /api/admin/status called');
    const adminStatus = await getAdminStatus();
    console.log('Admin status result:', adminStatus);

    if (adminStatus === null) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({ isAdmin: adminStatus });
  } catch (error) {
    console.error('Error in /api/admin/status:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
