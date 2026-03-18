import { prisma } from "../../lib/prisma";

export const getStreak = async (userId: string) => {
  return prisma.userStreak.findUnique({
    where: { userId },
  });
};