/*
  Warnings:

  - You are about to drop the column `paperStatus` on the `LabRecord` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "LabRecord_paperStatus_idx";

-- AlterTable
ALTER TABLE "LabRecord" DROP COLUMN "paperStatus",
ADD COLUMN     "materialsBrought" JSONB;
