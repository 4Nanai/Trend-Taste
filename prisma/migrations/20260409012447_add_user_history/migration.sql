-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('PUSHED', 'STARRED', 'LIKED', 'DISLIKED');

-- CreateTable
CREATE TABLE "UserHistory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" BIGINT NOT NULL,
    "repoId" BIGINT NOT NULL,
    "interactionType" "InteractionType" NOT NULL,

    CONSTRAINT "UserHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserHistory_userId_idx" ON "UserHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserHistory_userId_repoId_key" ON "UserHistory"("userId", "repoId");
