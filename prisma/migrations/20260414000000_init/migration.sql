-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'GESTOR_MUNICIPIO');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('RECLAMACAO', 'SUGESTAO', 'SOLICITACAO', 'ELOGIO');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('URBANA', 'RURAL');

-- CreateEnum
CREATE TYPE "EvaluationScope" AS ENUM ('MUNICIPIO', 'ESTADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'GESTOR_MUNICIPIO',
    "stateId" TEXT,
    "municipalityId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipalities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secretaries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "stateId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secretaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "scope" "EvaluationScope" NOT NULL DEFAULT 'MUNICIPIO',
    "stateId" TEXT NOT NULL,
    "municipalityId" TEXT,
    "secretaryId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpfHash" TEXT,
    "citizenWhatsapp" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "locationType" "LocationType" NOT NULL DEFAULT 'URBANA',
    "rating" INTEGER NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_municipalityId_idx" ON "users"("municipalityId");

-- CreateIndex
CREATE UNIQUE INDEX "states_code_key" ON "states"("code");

-- CreateIndex
CREATE UNIQUE INDEX "states_slug_key" ON "states"("slug");

-- CreateIndex
CREATE INDEX "states_active_idx" ON "states"("active");

-- CreateIndex
CREATE UNIQUE INDEX "municipalities_stateId_slug_key" ON "municipalities"("stateId", "slug");

-- CreateIndex
CREATE INDEX "municipalities_stateId_active_idx" ON "municipalities"("stateId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "secretaries_stateId_name_key" ON "secretaries"("stateId", "name");

-- CreateIndex
CREATE INDEX "secretaries_stateId_active_idx" ON "secretaries"("stateId", "active");

-- CreateIndex
CREATE INDEX "evaluations_stateId_municipalityId_createdAt_idx" ON "evaluations"("stateId", "municipalityId", "createdAt");

-- CreateIndex
CREATE INDEX "evaluations_municipalityId_createdAt_idx" ON "evaluations"("municipalityId", "createdAt");

-- CreateIndex
CREATE INDEX "evaluations_secretaryId_idx" ON "evaluations"("secretaryId");

-- CreateIndex
CREATE INDEX "evaluations_feedbackType_idx" ON "evaluations"("feedbackType");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipalities" ADD CONSTRAINT "municipalities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretaries" ADD CONSTRAINT "secretaries_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "municipalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "secretaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;