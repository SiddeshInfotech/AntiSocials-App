-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "actionType" TEXT;

-- AlterTable
ALTER TABLE "UserStreak" ADD COLUMN     "journeyDay" INTEGER NOT NULL DEFAULT 1;
