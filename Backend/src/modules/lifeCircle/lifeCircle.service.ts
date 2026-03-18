import { prisma } from "../../lib/prisma";

export const getLifeCircle = async (userId: string) => {
  return prisma.lifeCircleScore.findMany({
    where: { userId },
  });
};