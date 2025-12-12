import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { sendEmail } from '@/lib/email/ses';

export const dynamic = 'force-dynamic';

// Generate a 6-digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Generate OTP code
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused OTP codes for this email
    await prisma.otpCode.updateMany({
      where: {
        email: email.toLowerCase(),
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Create new OTP code
    await prisma.otpCode.create({
      data: {
        email: email.toLowerCase(),
        code,
        expiresAt,
      },
    });

    // Send OTP via email
    const isDev = process.env.NODE_ENV === 'development';
    const hasSES = process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY;

    if (isDev || !hasSES) {
      // Log to console in development
      console.error('\n═══════════════════════════════════════════════════════════');
      console.error('📧 OTP CODE - For local development:');
      console.error(`   Email: ${email}`);
      console.error(`   Code: ${code}`);
      console.error(`   Expires in 10 minutes`);
      console.error('═══════════════════════════════════════════════════════════\n');
    } else {
      // Send via SES in production
      await sendEmail({
        to: email,
        subject: 'Your Login Code for Kinetic Community',
        html: `
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <table width="100%" border="0" cellspacing="20" cellpadding="0" style="max-width: 600px; margin: auto; border-radius: 10px;">
              <tr>
                <td align="center" style="padding: 10px 0px; font-size: 22px;">
                  Login to <strong>Kinetic Community</strong>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1;">
                    ${code}
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px;">
                  Enter this code in the app to log in. This code will expire in <strong>10 minutes</strong>.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 0px 0px 10px 0px; font-size: 14px; color: #666;">
                  If you did not request this code, you can safely ignore this email.
                </td>
              </tr>
            </table>
          </body>
        `,
      });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}

