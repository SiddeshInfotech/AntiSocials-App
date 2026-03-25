import { NotificationStatus, NotificationType } from "@prisma/client";
import cron from "node-cron";
import { sendPushNotification } from "../integrations/push";
import { prisma } from "../lib/prisma";
import { getLocalDateString, localDateTimeToUtc } from "../utils/date";

function idempotencyKey(
  type: NotificationType,
  userId: string,
  date: string,
): string {
  return `${type}:${userId}:${date}:none`;
}

async function enqueueIfMissing(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledAt: Date;
  dateKey: string;
}) {
  const key = idempotencyKey(input.type, input.userId, input.dateKey);

  await prisma.notificationEvent.upsert({
    where: { idempotencyKey: key },
    update: {
      title: input.title,
      body: input.body,
      scheduledAt: input.scheduledAt,
      status: NotificationStatus.PENDING,
    },
    create: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      scheduledAt: input.scheduledAt,
      idempotencyKey: key,
    },
  });
}

async function evaluateStreakBreaks(): Promise<void> {
  const now = new Date();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      timezone: true,
      streak: true,
    },
  });

  for (const user of users) {
    if (!user.streak) {
      continue;
    }

    const localToday = getLocalDateString(now, user.timezone);
    const previousLocal = user.streak.lastActivityDate
      ? getLocalDateString(user.streak.lastActivityDate, user.timezone)
      : null;

    if (!previousLocal) {
      continue;
    }

    if (previousLocal >= localToday || user.streak.currentStreak <= 0) {
      continue;
    }

    const sourceStreak = user.streak.currentStreak;

    await prisma.userStreak.update({
      where: { userId: user.id },
      data: {
        currentStreak: 0,
        currentMonthStreak: 0,
        currentYearStreak: 0,
        isInRecovery: true,
        recoverySourceStreak: sourceStreak,
        recoveryCompletedDays: 0,
        lastBreakDate: now,
      },
    });

    await enqueueIfMissing({
      userId: user.id,
      type: NotificationType.STREAK_BROKEN,
      title: "Streak Broken",
      body: "You missed a day. Complete tasks for 3 days to restore your streak.",
      scheduledAt: now,
      dateKey: localToday,
    });

    await enqueueIfMissing({
      userId: user.id,
      type: NotificationType.TASK_MISSED_NUDGE,
      title: "You Missed Today's Task",
      body: "No problem. Restart today and rebuild momentum.",
      scheduledAt: now,
      dateKey: localToday,
    });
  }
}

async function enqueueRecoveryNudges(): Promise<void> {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      streak: {
        isInRecovery: true,
      },
    },
    select: {
      id: true,
      timezone: true,
      streak: true,
    },
  });

  for (const user of users) {
    if (!user.streak) {
      continue;
    }

    const localToday = getLocalDateString(now, user.timezone);
    const lastDoneLocal = user.streak.lastActivityDate
      ? getLocalDateString(user.streak.lastActivityDate, user.timezone)
      : null;

    if (lastDoneLocal === localToday) {
      continue;
    }

    const scheduleAt = localDateTimeToUtc(localToday, 18, 0, user.timezone);

    await enqueueIfMissing({
      userId: user.id,
      type: NotificationType.STREAK_RECOVERY_NUDGE,
      title: "Restore Your Streak",
      body: "Complete today's task. 3 consistent days restores your streak.",
      scheduledAt: scheduleAt,
      dateKey: localToday,
    });
  }
}

async function dispatchPendingNotifications(): Promise<void> {
  const now = new Date();
  const pendingEvents = await prisma.notificationEvent.findMany({
    where: {
      status: NotificationStatus.PENDING,
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: 50,
  });

  for (const event of pendingEvents) {
    const tokens = await prisma.userDeviceToken.findMany({
      where: {
        userId: event.userId,
        isActive: true,
      },
      select: { token: true },
    });

    try {
      await sendPushNotification({
        tokens: tokens.map((item) => item.token),
        title: event.title,
        body: event.body,
        data: {
          type: event.type,
          eventId: event.id,
          userDailyTaskId: event.userDailyTaskId || "",
        },
      });

      await prisma.notificationEvent.update({
        where: { id: event.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.notificationEvent.update({
        where: { id: event.id },
        data: {
          status: NotificationStatus.FAILED,
          retryCount: { increment: 1 },
          lastError: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
}

export function startNotificationJobs(): void {
  cron.schedule("*/5 * * * *", async () => {
    await dispatchPendingNotifications();
  });

  cron.schedule("0 * * * *", async () => {
    await evaluateStreakBreaks();
    await enqueueRecoveryNudges();
  });
}
