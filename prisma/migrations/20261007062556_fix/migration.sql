-- DropForeignKey
ALTER TABLE "LabRecord" DROP CONSTRAINT "LabRecord_studentId_fkey";

-- AlterTable
ALTER TABLE "LabRecord" ADD COLUMN     "attendance" TEXT NOT NULL DEFAULT 'Present',
ADD COLUMN     "marks" INTEGER,
ADD COLUMN     "maxMarks" INTEGER;

-- CreateIndex
CREATE INDEX "LabRecord_attendance_idx" ON "LabRecord"("attendance");

-- AddForeignKey
ALTER TABLE "LabRecord" ADD CONSTRAINT "LabRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE CASCADE ON UPDATE CASCADE;
