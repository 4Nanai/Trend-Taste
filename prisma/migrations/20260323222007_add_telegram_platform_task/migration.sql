/*
  Warnings:

  - A unique constraint covering the columns `[platform,channelId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('DISCORD', 'TELEGRAM');

-- DropIndex
DROP INDEX "Task_channelId_key";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "platform" "Platform" NOT NULL DEFAULT 'DISCORD';

-- CreateIndex
CREATE UNIQUE INDEX "Task_platform_channelId_key" ON "Task"("platform", "channelId");
