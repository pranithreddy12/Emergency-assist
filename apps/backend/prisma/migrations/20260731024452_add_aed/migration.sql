-- CreateTable
CREATE TABLE "Aed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "access" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Aed_latitude_longitude_idx" ON "Aed"("latitude", "longitude");
