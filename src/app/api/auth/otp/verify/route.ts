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

    // Create session token
    const salt = 'authjs.session-token';
    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      secret: process.env.AUTH_SECRET!,
      salt,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set session cookie
    const cookieStore = await cookies();
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';
    
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
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

