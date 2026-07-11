-- CreateEnum
CREATE TYPE "PrearrivalStatus" AS ENUM ('SENT', 'ACKNOWLEDGED', 'DECLINED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS', 'WHATSAPP', 'EMAIL', 'CALL');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "trackingEnabledAt" TIMESTAMP(3),
ADD COLUMN     "trackingToken" TEXT;

-- CreateTable
CREATE TABLE "HospitalPrearrival" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "status" "PrearrivalStatus" NOT NULL DEFAULT 'SENT',
    "etaSeconds" INTEGER,
    "payload" JSONB NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "ackNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalPrearrival_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "incidentId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HospitalPrearrival_hospitalId_idx" ON "HospitalPrearrival"("hospitalId");

-- CreateIndex
CREATE INDEX "HospitalPrearrival_incidentId_idx" ON "HospitalPrearrival"("incidentId");

-- CreateIndex
CREATE INDEX "NotificationLog_incidentId_idx" ON "NotificationLog"("incidentId");

-- CreateIndex
CREATE INDEX "NotificationLog_channel_idx" ON "NotificationLog"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_trackingToken_key" ON "Incident"("trackingToken");

-- AddForeignKey
ALTER TABLE "HospitalPrearrival" ADD CONSTRAINT "HospitalPrearrival_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalPrearrival" ADD CONSTRAINT "HospitalPrearrival_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

