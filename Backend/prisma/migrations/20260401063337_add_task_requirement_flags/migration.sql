-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "requiresPhotoVerification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresSubtask" BOOLEAN NOT NULL DEFAULT false;
