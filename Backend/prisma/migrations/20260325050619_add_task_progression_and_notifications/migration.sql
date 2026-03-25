-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('ANDROID', 'IOS', 'WEB');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_REMINDER', 'TASK_COMPLETED_CONGRATS', 'TASK_MISSED_NUDGE', 'STREAK_BROKEN', 'STREAK_RECOVERY_NUDGE', 'STREAK_RESTORED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELED');

-- AlterTable
ALTER TABLE "UserStreak" ADD COLUMN     "bestMonthStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bestYearStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedTaskCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentLevel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "currentMonthStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentYearStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isInRecovery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastBreakDate" TIMESTAMP(3),
ADD COLUMN     "monthKey" TEXT,
ADD COLUMN     "recoveryCompletedDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recoverySourceStreak" INTEGER,
ADD COLUMN     "yearKey" INTEGER;

-- CreateTable
CREATE TABLE "UserDeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userDailyTaskId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDeviceToken_token_key" ON "UserDeviceToken"("token");

-- CreateIndex
CREATE INDEX "UserDeviceToken_userId_isActive_idx" ON "UserDeviceToken"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationEvent_idempotencyKey_key" ON "NotificationEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "NotificationEvent_status_scheduledAt_idx" ON "NotificationEvent"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_userId_type_idx" ON "NotificationEvent"("userId", "type");

-- AddForeignKey
ALTER TABLE "UserDeviceToken" ADD CONSTRAINT "UserDeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEvent" ADD CONSTRAINT "NotificationEvent_userDailyTaskId_fkey" FOREIGN KEY ("userDailyTaskId") REFERENCES "UserDailyTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
