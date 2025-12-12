import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
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

    // Create JWT token exactly like NextAuth does
    const secret = process.env.AUTH_SECRET!;
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction 
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token';
    
    const token = await encode({
      token: {
        email: user.email,
        sub: user.id,
        name: user.name || user.username,
        picture: user.image,
      },
      secret,
      maxAge,
      salt: cookieName, // Use the cookie name as salt, just like NextAuth does
    });

    // Set the session cookie
    const cookieStore = await cookies();
    
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

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

