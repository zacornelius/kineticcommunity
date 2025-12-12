import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    // Find valid OTP code
    console.log('Looking for OTP:', { email: email.toLowerCase(), code: code.trim() });
    
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

    console.log('OTP Record found:', otpRecord ? 'YES' : 'NO');

    if (!otpRecord) {
      // Check if there's any OTP for this email
      const anyOtp = await prisma.otpCode.findMany({
        where: { email: email.toLowerCase() },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });
      console.log('Recent OTPs for email:', anyOtp);
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

    // Create a database session for NextAuth
    const sessionToken = randomUUID();
    const sessionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: sessionExpiry,
      },
    });

    // Set the session cookie
    const response = NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction 
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: sessionExpiry,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}

