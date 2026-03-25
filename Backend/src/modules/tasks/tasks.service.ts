import {
  NotificationStatus,
  NotificationType,
  Prisma,
  Task,
  TaskStatus,
  WalletTransactionType,
} from "@prisma/client";
import {
  getLevelPoolTarget,
  getPointsPerLevel,
  LIFE_CIRCLE_SCORE_INCREMENT,
  LIFE_CIRCLE_SCORE_MAX,
  MAX_TASK_LEVEL,
  RECENT_TASK_EXCLUSION_DAYS,
  STREAK_RECOVERY_DAYS_REQUIRED,
  TASKS_PER_LEVEL,
  TASKS_PER_DAY,
} from "../../constants/tasks";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/error-handler";
import {
  dayStartUtcFromTimezone,
  getLocalDateString,
  localDateTimeToUtc,
} from "../../utils/date";
import { pickTaskForLevel } from "./tasks.engine";

function getDaysBetween(start: Date, end: Date): number {
  const startDay = new Date(start.toISOString().slice(0, 10));
  const endDay = new Date(end.toISOString().slice(0, 10));
  return Math.floor((endDay.getTime() - startDay.getTime()) / 86_400_000);
}

async function getUserOrThrow(
  userId: string,
): Promise<{ id: string; timezone: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, timezone: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

function getLevelFromCompletedCount(
  completedTaskCount: number,
  maxAvailableLevel: number,
): number {
  const baseLevel = Math.floor(completedTaskCount / TASKS_PER_LEVEL) + 1;
  return Math.min(MAX_TASK_LEVEL, Math.min(maxAvailableLevel, baseLevel));
}

function buildNotificationIdempotencyKey(
  type: NotificationType,
  userId: string,
  localDate: string,
  userDailyTaskId?: string,
): string {
  return `${type}:${userId}:${localDate}:${userDailyTaskId || "none"}`;
}

async function queueNotificationEvent(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledAt: Date;
  localDate: string;
  userDailyTaskId?: string;
}) {
  await prisma.notificationEvent.upsert({
    where: {
      idempotencyKey: buildNotificationIdempotencyKey(
        input.type,
        input.userId,
        input.localDate,
        input.userDailyTaskId,
      ),
    },
    update: {
      title: input.title,
      body: input.body,
      scheduledAt: input.scheduledAt,
      status: NotificationStatus.PENDING,
      userDailyTaskId: input.userDailyTaskId,
    },
    create: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      scheduledAt: input.scheduledAt,
      userDailyTaskId: input.userDailyTaskId,
      idempotencyKey: buildNotificationIdempotencyKey(
        input.type,
        input.userId,
        input.localDate,
        input.userDailyTaskId,
      ),
    },
  });
}

async function queueTaskReminderEvent(params: {
  userId: string;
  userDailyTaskId: string;
  taskTitle: string;
  timezone: string;
  assignedDate: Date;
}) {
  const localDate = getLocalDateString(params.assignedDate, params.timezone);
  const scheduledAt = localDateTimeToUtc(localDate, 20, 0, params.timezone);

  await queueNotificationEvent({
    userId: params.userId,
    type: NotificationType.TASK_REMINDER,
    title: "Task Reminder",
    body: `Today's task: ${params.taskTitle}`,
    scheduledAt,
    localDate,
    userDailyTaskId: params.userDailyTaskId,
  });
}

async function pickSingleTaskForToday(input: {
  userId: string;
  assignedDate: Date;
  completedTaskCount: number;
}): Promise<Task> {
  const recentWindow = new Date(input.assignedDate);
  recentWindow.setDate(recentWindow.getDate() - RECENT_TASK_EXCLUSION_DAYS);

  const [tasks, recent] = await Promise.all([
    prisma.task.findMany({
      where: { isActive: true },
    }),
    prisma.userDailyTask.findMany({
      where: {
        userId: input.userId,
        assignedDate: {
          gte: recentWindow,
        },
      },
      select: { taskId: true },
    }),
  ]);

  if (tasks.length < TASKS_PER_DAY) {
    throw new AppError("Task seed catalog is too small", 500);
  }

  const maxAvailableLevel = Math.max(...tasks.map((task) => task.level));
  const targetLevel = getLevelFromCompletedCount(
    input.completedTaskCount,
    maxAvailableLevel,
  );

  return pickTaskForLevel(
    tasks,
    targetLevel,
    new Set(recent.map((t) => t.taskId)),
  );
}

export async function getTodayTasks(userId: string) {
  const user = await getUserOrThrow(userId);
  const now = new Date();
  const assignedDate = dayStartUtcFromTimezone(now, user.timezone);

  const existing = await prisma.userDailyTask.findMany({
    where: {
      userId,
      assignedDate,
    },
    include: {
      task: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing.length > 0) {
    return existing;
  }

  const streak = await prisma.userStreak.findUnique({ where: { userId } });

  if (!streak) {
    throw new AppError("Streak profile not found", 500);
  }

  const selectedTask = await pickSingleTaskForToday({
    userId,
    assignedDate,
    completedTaskCount: streak.completedTaskCount,
  });

  const assigned = await prisma.userDailyTask.create({
    data: {
      userId,
      taskId: selectedTask.id,
      assignedDate,
      status: TaskStatus.PENDING,
    },
    include: { task: true },
  });

  await queueTaskReminderEvent({
    userId,
    userDailyTaskId: assigned.id,
    taskTitle: assigned.task.title,
    timezone: user.timezone,
    assignedDate,
  });

  return [assigned];
}

export async function completeTask(userId: string, userDailyTaskId: string) {
  const user = await getUserOrThrow(userId);
  const now = new Date();
  const todayLocal = getLocalDateString(now, user.timezone);

  const assigned = await prisma.userDailyTask.findFirst({
    where: {
      id: userDailyTaskId,
      userId,
    },
    include: {
      task: true,
    },
  });

  if (!assigned) {
    throw new AppError("Task not assigned to user", 404);
  }

  if (assigned.status === TaskStatus.COMPLETED) {
    throw new AppError("Task already completed", 409);
  }

  const awardedPoints = getPointsPerLevel(assigned.task.level);
  if (!awardedPoints) {
    throw new AppError(`Unsupported task level: ${assigned.task.level}`, 500);
  }

  const [wallet, streak, existingScore] = await Promise.all([
    prisma.userWallet.findUnique({ where: { userId } }),
    prisma.userStreak.findUnique({ where: { userId } }),
    prisma.lifeCircleScore.findUnique({
      where: {
        userId_parameter: {
          userId,
          parameter: assigned.task.parameter,
        },
      },
    }),
  ]);

  if (!wallet) {
    throw new AppError("Wallet profile not found", 500);
  }

  if (!streak) {
    throw new AppError("Streak profile not found", 500);
  }

  if (!existingScore) {
    throw new AppError("Life circle score profile missing", 500);
  }

  const previousLocal = streak.lastActivityDate
    ? getLocalDateString(streak.lastActivityDate, user.timezone)
    : null;

  let currentStreak = streak.currentStreak;
  let currentMonthStreak = streak.currentMonthStreak;
  let currentYearStreak = streak.currentYearStreak;
  let isInRecovery = streak.isInRecovery;
  let recoverySourceStreak = streak.recoverySourceStreak;
  let recoveryCompletedDays = streak.recoveryCompletedDays;
  let restoredRecovery = false;

  const todayMonthKey = todayLocal.slice(0, 7);
  const todayYearKey = Number(todayLocal.slice(0, 4));
  const previousMonthKey = streak.monthKey;
  const previousYearKey = streak.yearKey;

  if (!previousLocal) {
    currentStreak = 1;
    currentMonthStreak = 1;
    currentYearStreak = 1;
  } else if (previousLocal === todayLocal) {
    currentStreak = streak.currentStreak;
    currentMonthStreak = streak.currentMonthStreak;
    currentYearStreak = streak.currentYearStreak;
  } else {
    const gap = getDaysBetween(new Date(previousLocal), new Date(todayLocal));
    currentStreak = gap <= 1 ? streak.currentStreak + 1 : 1;

    const sameMonth = previousMonthKey === todayMonthKey;
    const sameYear = previousYearKey === todayYearKey;

    currentMonthStreak =
      gap <= 1 && sameMonth ? streak.currentMonthStreak + 1 : 1;
    currentYearStreak = gap <= 1 && sameYear ? streak.currentYearStreak + 1 : 1;

    if (streak.isInRecovery) {
      recoveryCompletedDays = gap <= 1 ? streak.recoveryCompletedDays + 1 : 1;
      if (
        recoveryCompletedDays >= STREAK_RECOVERY_DAYS_REQUIRED &&
        streak.recoverySourceStreak
      ) {
        currentStreak = Math.max(currentStreak, streak.recoverySourceStreak);
        isInRecovery = false;
        recoverySourceStreak = null;
        recoveryCompletedDays = 0;
        restoredRecovery = true;
      }
    }
  }

  const nextCompletedTaskCount = streak.completedTaskCount + 1;
  const nextLevel = Math.min(
    MAX_TASK_LEVEL,
    Math.floor(nextCompletedTaskCount / TASKS_PER_LEVEL) + 1,
  );
  const currentLevelTaskPoints = getPointsPerLevel(nextLevel);
  const currentLevelPoolTarget = getLevelPoolTarget(nextLevel);
  const completedTasksInCurrentLevel = nextCompletedTaskCount % TASKS_PER_LEVEL;
  const currentLevelPoolEarned =
    completedTasksInCurrentLevel * currentLevelTaskPoints;

  const localDateForEvent = getLocalDateString(now, user.timezone);

  try {
    await prisma.$transaction([
      prisma.userTaskCompletion.create({
        data: {
          userDailyTaskId: assigned.id,
          pointsEarned: awardedPoints,
        },
      }),
      prisma.userDailyTask.update({
        where: { id: assigned.id },
        data: {
          status: TaskStatus.COMPLETED,
          completedAt: now,
        },
      }),
      prisma.userWallet.update({
        where: { userId },
        data: {
          balance: { increment: awardedPoints },
          totalEarned: { increment: awardedPoints },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.TASK_COMPLETION,
          amount: awardedPoints,
          description: `Points from ${assigned.task.title}`,
        },
      }),
      prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak,
          bestStreak: Math.max(streak.bestStreak, currentStreak),
          currentMonthStreak,
          bestMonthStreak: Math.max(streak.bestMonthStreak, currentMonthStreak),
          currentYearStreak,
          bestYearStreak: Math.max(streak.bestYearStreak, currentYearStreak),
          monthKey: todayMonthKey,
          yearKey: todayYearKey,
          completedTaskCount: nextCompletedTaskCount,
          currentLevel: nextLevel,
          isInRecovery,
          recoverySourceStreak,
          recoveryCompletedDays,
          lastActivityDate: now,
        },
      }),
      prisma.lifeCircleScore.update({
        where: {
          userId_parameter: {
            userId,
            parameter: assigned.task.parameter,
          },
        },
        data: {
          score: Math.min(
            LIFE_CIRCLE_SCORE_MAX,
            existingScore.score + LIFE_CIRCLE_SCORE_INCREMENT,
          ),
          lastActivityDate: now,
        },
      }),
      prisma.notificationEvent.create({
        data: {
          userId,
          userDailyTaskId: assigned.id,
          type: NotificationType.TASK_COMPLETED_CONGRATS,
          title: "Task Completed",
          body: `Great job! You completed: ${assigned.task.title}`,
          scheduledAt: now,
          idempotencyKey: buildNotificationIdempotencyKey(
            NotificationType.TASK_COMPLETED_CONGRATS,
            userId,
            localDateForEvent,
            assigned.id,
          ),
        },
      }),
      prisma.notificationEvent.updateMany({
        where: {
          userId,
          userDailyTaskId: assigned.id,
          type: NotificationType.TASK_REMINDER,
          status: NotificationStatus.PENDING,
        },
        data: {
          status: NotificationStatus.CANCELED,
          lastError: "Task already completed before reminder dispatch",
        },
      }),
      ...(restoredRecovery
        ? [
            prisma.notificationEvent.create({
              data: {
                userId,
                type: NotificationType.STREAK_RESTORED,
                title: "Streak Restored",
                body: "Your streak has been fully restored. Keep going!",
                scheduledAt: now,
                idempotencyKey: buildNotificationIdempotencyKey(
                  NotificationType.STREAK_RESTORED,
                  userId,
                  localDateForEvent,
                ),
              },
            }),
          ]
        : []),
    ]);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Task already completed", 409);
    }

    throw error;
  }

  return {
    taskId: assigned.id,
    points: awardedPoints,
    currentStreak,
    currentLevel: nextLevel,
    currentLevelTaskPoints,
    currentLevelPoolTarget,
    currentLevelPoolEarned,
    completedTasksInCurrentLevel,
    recovery: {
      isInRecovery,
      daysCompleted: recoveryCompletedDays,
      requiredDays: STREAK_RECOVERY_DAYS_REQUIRED,
    },
  };
}
