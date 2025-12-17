import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 * Simple health check endpoint for ALB and keep-alive pings
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
