-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "activeSessionId" TEXT;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_activeSessionId_fkey" FOREIGN KEY ("activeSessionId") REFERENCES "LabSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
