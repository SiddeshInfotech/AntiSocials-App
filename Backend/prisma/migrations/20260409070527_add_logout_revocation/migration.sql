-- AlterTable
ALTER TABLE "Community" ALTER COLUMN "customCategory" SET DATA TYPE TEXT,
ALTER COLUMN "coverImageBase64" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "RevokedToken" (
    "id" TEXT NOT NULL,
    "tokenJti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_tokenJti_key" ON "RevokedToken"("tokenJti");

-- CreateIndex
CREATE INDEX "RevokedToken_userId_expiresAt_idx" ON "RevokedToken"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "RevokedToken" ADD CONSTRAINT "RevokedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
