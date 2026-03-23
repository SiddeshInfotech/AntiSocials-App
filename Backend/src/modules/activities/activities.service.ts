import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/error-handler";

export async function getDiscoverActivities(userId: string) {
  // Fetch user's interests first to sort matches to the top
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { interests: true },
  });

  const userInterests = user?.interests || [];

  // Activities the user HAS NOT joined yet
  const activities = await prisma.community.findMany({
    where: {
      NOT: {
        members: {
          some: { userId },
        },
      },
    },
    include: {
      owner: { select: { name: true, profilePhoto: true } },
      _count: { select: { members: true } },
    },
    orderBy: { date: "asc" },
  });

  // Sort them loosely: Activities matching interests first
  return activities.sort((a, b) => {
    const aMatch = userInterests.includes(a.category) ? 1 : 0;
    const bMatch = userInterests.includes(b.category) ? 1 : 0;
    return bMatch - aMatch;
  });
}

export async function getJoinedActivities(userId: string) {
  // Activities the user HAS joined
  const memberships = await prisma.communityMember.findMany({
    where: { userId },
    include: {
      community: {
        include: {
          owner: { select: { name: true, profilePhoto: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => m.community);
}

export async function joinActivity(userId: string, activityId: string) {
  const existing = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: {
        userId,
        communityId: activityId,
      },
    },
  });

  if (existing) {
    throw new AppError("Already joined this activity", 400);
  }

  const activity = await prisma.community.findUnique({
    where: { id: activityId },
    include: { _count: { select: { members: true } } },
  });

  if (!activity) {
    throw new AppError("Activity not found", 404);
  }

  if (activity.maxMembers && activity._count.members >= activity.maxMembers) {
    throw new AppError("This activity is full", 403);
  }

  return prisma.communityMember.create({
    data: {
      userId,
      communityId: activityId,
    },
  });
}

export async function leaveActivity(userId: string, activityId: string) {
  const existing = await prisma.communityMember.findUnique({
    where: {
      userId_communityId: {
        userId,
        communityId: activityId,
      },
    },
  });

  if (!existing) {
    throw new AppError("You are not part of this activity", 400);
  }

  return prisma.communityMember.delete({
    where: { id: existing.id },
  });
}
