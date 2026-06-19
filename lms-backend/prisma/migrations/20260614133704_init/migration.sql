-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TECHNICIAN', 'PATHOLOGIST');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('CREATED', 'SAMPLE_COLLECTED', 'IN_ANALYSIS', 'VALIDATED', 'DISPATCHED');

-- CreateEnum
CREATE TYPE "TestFlag" AS ENUM ('NORMAL', 'HIGH', 'LOW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TECHNICIAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "patientUuid" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "nationalHealthId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStatus" "Status" NOT NULL DEFAULT 'CREATED',
    "priority" "Priority" NOT NULL DEFAULT 'ROUTINE',

    CONSTRAINT "AnalysisRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestItem" (
    "id" TEXT NOT NULL,
    "analysisRequestId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT NOT NULL,
    "referenceRangeMin" DOUBLE PRECISION NOT NULL,
    "referenceRangeMax" DOUBLE PRECISION NOT NULL,
    "flag" "TestFlag" NOT NULL DEFAULT 'NORMAL',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTrackingLog" (
    "id" TEXT NOT NULL,
    "analysisRequestId" TEXT NOT NULL,
    "fromStatus" "Status" NOT NULL,
    "toStatus" "Status" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handledByUserId" TEXT NOT NULL,
    "internalNotes" TEXT,

    CONSTRAINT "LabTrackingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patientUuid_key" ON "Patient"("patientUuid");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_nationalHealthId_key" ON "Patient"("nationalHealthId");

-- AddForeignKey
ALTER TABLE "AnalysisRequest" ADD CONSTRAINT "AnalysisRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestItem" ADD CONSTRAINT "TestItem_analysisRequestId_fkey" FOREIGN KEY ("analysisRequestId") REFERENCES "AnalysisRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTrackingLog" ADD CONSTRAINT "LabTrackingLog_analysisRequestId_fkey" FOREIGN KEY ("analysisRequestId") REFERENCES "AnalysisRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabTrackingLog" ADD CONSTRAINT "LabTrackingLog_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
