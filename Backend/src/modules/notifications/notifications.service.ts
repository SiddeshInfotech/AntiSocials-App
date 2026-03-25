import { DevicePlatform } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export async function registerDeviceToken(input: {
  userId: string;
  token: string;
  platform: DevicePlatform;
}) {
  return prisma.userDeviceToken.upsert({
    where: { token: input.token },
    update: {
      userId: input.userId,
      platform: input.platform,
      isActive: true,
      lastUsedAt: new Date(),
    },
    create: {
      userId: input.userId,
      token: input.token,
      platform: input.platform,
      isActive: true,
      lastUsedAt: new Date(),
    },
  });
}

export async function unregisterDeviceToken(input: {
  userId: string;
  token: string;
}) {
  return prisma.userDeviceToken.updateMany({
    where: {
      userId: input.userId,
      token: input.token,
      isActive: true,
    },
    data: {
      isActive: false,
      lastUsedAt: new Date(),
    },
  });
}

export async function getActiveDeviceTokens(userId: string) {
  return prisma.userDeviceToken.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      token: true,
      platform: true,
      updatedAt: true,
    },
  });
}
