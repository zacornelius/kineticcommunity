import authConfig from '@/auth.config';
import NextAuth from 'next-auth';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // Only run on protected routes - exclude root, API, static files
  matcher: [
    '/home/:path*',
    '/feed/:path*',
    '/discover/:path*',
    '/notifications/:path*',
    '/:username((?!api|_next|login|register|terms|privacy-policy)[^/]+)/:path*',
  ],
};
