import NextAuth from 'next-auth';
import authConfig from '@/auth.config';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma/prisma';
import { sendEmail } from '@/lib/email/ses';

declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string };
  }
}

// We are splitting the auth configuration into multiple files (`auth.config.ts` and `auth.ts`),
// as some adapters (Prisma) and Node APIs (`stream` module required for sending emails) are
// not supported in the Edge runtime. More info here: https://authjs.dev/guides/upgrade-to-v5
export const {
  auth,
  handlers: { GET, POST },
  signIn,
} = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: 'otp',
      name: 'OTP',
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        
        if (!user) return null;
        
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.username,
          image: user.image,
        };
      },
    }),
    {
      // There's currently an issue with NextAuth that requires all these properties to be specified
      // even if we really only need the `sendVerificationRequest`: https://github.com/nextauthjs/next-auth/issues/8125
      id: 'email',
      type: 'email',
      name: 'Email',
      from: 'noreply@norcio.dev',
      server: {},
      maxAge: 24 * 60 * 60,
      options: {},
      async sendVerificationRequest({ identifier: email, url }) {
        // Log what URL NextAuth generated and what env vars we have
        console.log('=== EMAIL DEBUG ===');
        console.log('Generated URL:', url);
        console.log('AUTH_URL:', process.env.AUTH_URL);
        console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
        console.log('URL:', process.env.URL);
        console.log('==================');

        // For local development, log the magic link to console
        const isDev = process.env.NODE_ENV === 'development';
        const hasSES = process.env.SES_ACCESS_KEY_ID && process.env.SES_SECRET_ACCESS_KEY;

        if (isDev || !hasSES) {
          // Use console.error to ensure it shows up in logs (stderr is more visible)
          console.error('\n═══════════════════════════════════════════════════════════');
          console.error('📧 EMAIL LOGIN - Magic Link for local development:');
          console.error(`   Email: ${email}`);
          console.error(`   Login URL: ${url}`);
          console.error('   (Copy and paste this URL in your browser to log in)');
          console.error('═══════════════════════════════════════════════════════════\n');
          return;
        }

        // Production: Send email via AWS SES
        try {
          await sendEmail({
            to: email,
            subject: 'Login to Kinetic Community',
            html: `<body>
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style=" max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif;">
        Login to <strong>Kinetic Community</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="#6366f1"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: white; text-decoration: none; border-radius: 5px; padding: 10px 20px; display: inline-block; font-weight: bold;">Login</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif;">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>`,
          });
        } catch (error) {
          console.error('Failed to send email:', error);
          throw new Error('Failed to send verification email');
        }
      },
    },
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    ...authConfig.callbacks,
    session({ token, user, ...rest }) {
      return {
        /**
         * We need to explicitly return the `id` here to make it available to the client
         * when calling `useSession()` as NextAuth does not include the user's id.
         *
         * If you only need to get the `id` of the user in the client, use NextAuth's
         * `useSession()`, but if you need more of user's data, use the `useSessionUserData()`
         * custom hook instead.
         */
        user: {
          id: token.sub!,
        },
        expires: rest.session.expires,
      };
    },
  },
});
