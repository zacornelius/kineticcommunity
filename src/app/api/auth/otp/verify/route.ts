import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // Find valid OTP code
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase(),
        code: code.trim(),
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          emailVerified: new Date(),
        },
      });
    } else if (!user.emailVerified) {
      // Update email verified status
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    // Create JWT session token
    const sessionMaxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    const sessionToken = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name || user.username || user.email,
        picture: user.image,
      },
      secret: process.env.AUTH_SECRET!,
      maxAge: sessionMaxAge,
    });

    // Set the NextAuth session cookie
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction 
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';
    
    cookieStore.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: sessionMaxAge,
      path: '/',
      ...(isProduction && { domain: '.kineticdogfood.com' }), // Set domain for production
    });

    // Return success
    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}

