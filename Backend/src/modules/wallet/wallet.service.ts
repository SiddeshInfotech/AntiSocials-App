import { prisma } from "../../lib/prisma";

export const getWallet = async (userId: string) => {
  return prisma.userWallet.findUnique({
    where: { userId },
  });
};

export const getTransactions = async (userId: string) => {
  return prisma.walletTransaction.findMany({
    where:  {
      wallet: {
        userId,
      },
    },
    orderBy: { createdAt: "desc" },
  });
};