import { getServerUser } from '@/lib/getServerUser';
import prisma from '@/lib/prisma/prisma';
import { isAdmin } from '@/lib/admin/isAdmin';

export const verifyAccessToComment = async (commentId: number) => {
  const [user] = await getServerUser();

  // Admins can delete any comment
  const adminStatus = await isAdmin();
  if (adminStatus) {
    return true;
  }

  // Regular users can only delete their own comments
  const count = await prisma.comment.count({
    where: {
      id: commentId,
      userId: user?.id,
    },
  });

  return count > 0;
};
