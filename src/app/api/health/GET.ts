import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint for ECS and load balancers
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
