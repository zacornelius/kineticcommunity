import 'server-only';
import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';

/**
 * Check if the current authenticated user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const [user] = await getServerUser();
  if (!user?.id) return false;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return dbUser?.isAdmin ?? false;
}

/**
 * Get the current user's admin status
 * Returns null if not authenticated
 */
export async function getAdminStatus(): Promise<boolean | null> {
  try {
    const [user] = await getServerUser();
    if (!user?.id) {
      console.log('No user in getAdminStatus');
      return null;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      console.log('User not found in database:', user.id);
      return null;
    }

    return dbUser.isAdmin ?? false;
  } catch (error) {
    console.error('Error in getAdminStatus:', error);
    throw error;
  }
}
