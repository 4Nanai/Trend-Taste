/*
  Warnings:

  - The primary key for the `Repo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `repoId` on the `Recommendation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `Repo` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX IF EXISTS "Recommendation_repoId_language_key";

-- AlterTable
ALTER TABLE "Recommendation"
ALTER COLUMN     "repoId" TYPE BIGINT
USING "repoId"::bigint;

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_repoId_language_key" ON "Recommendation"("repoId", "language");

-- AlterTable
ALTER TABLE "Repo"
ALTER COLUMN     "id" TYPE BIGINT
USING "id"::bigint;
