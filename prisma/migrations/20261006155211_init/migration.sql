-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "rollNo" INTEGER NOT NULL,
    "notes" TEXT,
    "parentPin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "class" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "activity" TEXT NOT NULL DEFAULT '',
    "learned" TEXT,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "rollNo" INTEGER NOT NULL,
    "taskStatus" TEXT NOT NULL DEFAULT 'Completed',
    "paperStatus" TEXT NOT NULL DEFAULT 'Brought',
    "remarks" TEXT,
    "verified" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_username_key" ON "Teacher"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_class_section_idx" ON "Student"("class", "section");

-- CreateIndex
CREATE INDEX "Student_studentId_idx" ON "Student"("studentId");

-- CreateIndex
CREATE INDEX "LabSession_class_section_idx" ON "LabSession"("class", "section");

-- CreateIndex
CREATE INDEX "LabSession_date_idx" ON "LabSession"("date");

-- CreateIndex
CREATE INDEX "LabSession_teacherId_idx" ON "LabSession"("teacherId");

-- CreateIndex
CREATE INDEX "LabRecord_sessionId_idx" ON "LabRecord"("sessionId");

-- CreateIndex
CREATE INDEX "LabRecord_studentId_idx" ON "LabRecord"("studentId");

-- CreateIndex
CREATE INDEX "LabRecord_taskStatus_idx" ON "LabRecord"("taskStatus");

-- CreateIndex
CREATE INDEX "LabRecord_paperStatus_idx" ON "LabRecord"("paperStatus");

-- AddForeignKey
ALTER TABLE "LabSession" ADD CONSTRAINT "LabSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRecord" ADD CONSTRAINT "LabRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LabSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRecord" ADD CONSTRAINT "LabRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;
