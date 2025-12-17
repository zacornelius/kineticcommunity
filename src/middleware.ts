import authConfig from '@/auth.config';
import NextAuth from 'next-auth';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // Exclude root page, API routes, static files, and Next.js internals
  matcher: [
    '/((?!api|_next/static|_next/image|.png|.jpg|.jpeg|favicon.ico|manifest.json|sw.js|$).*)',
  ],
};
