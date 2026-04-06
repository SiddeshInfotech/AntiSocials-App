import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/error-handler";
import { CREATE_ACTIVITY_MIN_WALLET_BALANCE } from "../../constants/activities";
import { validateImage } from "../../utils/imageValidation";
import { CreateActivityPayload } from "./activities.schema";

function normalizeTimeTo24Hour(time: string): string {
  const trimmed = time.trim();

  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/);
  if (!match) {
    throw new AppError("Invalid time format", 400);
  }

  const [, hourText, minute, period] = match;
  let hour = Number(hourText);
  const normalizedPeriod = period.toUpperCase();

  if (normalizedPeriod === "AM" && hour === 12) {
    hour = 0;
  }
  if (normalizedPeriod === "PM" && hour !== 12) {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function getScheduledDate(date?: string, time?: string): Date | null {
  if (!date && !time) {
    return null;
  }

  if (!date || !time) {
    throw new AppError("Both date and time are required together", 400);
  }

  const time24Hour = normalizeTimeTo24Hour(time);
  const candidate = new Date(`${date}T${time24Hour}:00.000Z`);
  if (Number.isNaN(candidate.getTime())) {
    throw new AppError("Invalid date/time value", 400);
  }

  return candidate;
}

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
    const aCategory =
      a.category === "OTHER" ? (a.customCategory ?? "") : a.category;
    const bCategory =
      b.category === "OTHER" ? (b.customCategory ?? "") : b.category;
    const aMatch = userInterests.includes(aCategory) ? 1 : 0;
    const bMatch = userInterests.includes(bCategory) ? 1 : 0;
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

export async function createActivity(
  userId: string,
  payload: CreateActivityPayload,
) {
  const wallet = await prisma.userWallet.findUnique({
    where: { userId },
    select: { balance: true },
  });

  if (!wallet || wallet.balance < CREATE_ACTIVITY_MIN_WALLET_BALANCE) {
    throw new AppError(
      `You need at least ${CREATE_ACTIVITY_MIN_WALLET_BALANCE} points in your wallet to create an activity`,
      403,
    );
  }

  if (payload.coverImageBase64) {
    validateImage(payload.coverImageBase64);
  }

  const scheduledDate = getScheduledDate(payload.date, payload.time);
  const customCategory =
    payload.category === "OTHER"
      ? payload.customCategory?.trim() || null
      : null;

  return prisma.community.create({
    data: {
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      category: payload.category,
      customCategory,
      date: scheduledDate,
      location: payload.location.trim(),
      maxMembers: payload.maxMembers ?? null,
      coverImageBase64: payload.coverImageBase64 ?? null,
      ownerId: userId,
    },
    include: {
      owner: { select: { name: true, profilePhoto: true } },
      _count: { select: { members: true } },
    },
  });
}
