import { Prisma, TaskStatus, WalletTransactionType } from "@prisma/client";
import {
  LIFE_CIRCLE_SCORE_INCREMENT,
  LIFE_CIRCLE_SCORE_MAX,
  RECENT_TASK_EXCLUSION_DAYS,
  TASKS_PER_DAY,
} from "../../constants/tasks";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/error-handler";
import { dayStartUtcFromTimezone, getLocalDateString } from "../../utils/date";
import { buildDailyTaskSet } from "./tasks.engine";

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

  const recentWindow = new Date(assignedDate);
  recentWindow.setDate(recentWindow.getDate() - RECENT_TASK_EXCLUSION_DAYS);

  const [tasks, recent] = await Promise.all([
    prisma.task.findMany({
      where: { isActive: true },
    }),
    prisma.userDailyTask.findMany({
      where: {
        userId,
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

  const selected = buildDailyTaskSet(
    tasks,
    new Set(recent.map((item) => item.taskId)),
  );

  if (selected.length < TASKS_PER_DAY) {
    throw new AppError("Not enough active tasks to assign today", 500);
  }

  await prisma.$transaction(
    selected.map((task) =>
      prisma.userDailyTask.create({
        data: {
          userId,
          taskId: task.id,
          assignedDate,
          status: TaskStatus.PENDING,
        },
      }),
    ),
  );

  return prisma.userDailyTask.findMany({
    where: {
      userId,
      assignedDate,
    },
    include: { task: true },
    orderBy: { createdAt: "asc" },
  });
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

  if (!previousLocal) {
    currentStreak = 1;
  } else if (previousLocal === todayLocal) {
    currentStreak = streak.currentStreak;
  } else {
    const gap = getDaysBetween(new Date(previousLocal), new Date(todayLocal));
    currentStreak = gap <= 1 ? streak.currentStreak + 1 : 1;
  }

  try {
    await prisma.$transaction([
      prisma.userTaskCompletion.create({
        data: {
          userDailyTaskId: assigned.id,
          pointsEarned: assigned.task.points,
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
          balance: { increment: assigned.task.points },
          totalEarned: { increment: assigned.task.points },
        },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.TASK_COMPLETION,
          amount: assigned.task.points,
          description: `Points from ${assigned.task.title}`,
        },
      }),
      prisma.userStreak.update({
        where: { userId },
        data: {
          currentStreak,
          bestStreak: Math.max(streak.bestStreak, currentStreak),
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
    points: assigned.task.points,
  };
}
