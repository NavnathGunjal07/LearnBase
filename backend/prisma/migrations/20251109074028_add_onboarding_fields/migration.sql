-- AlterTable
ALTER TABLE "users" ADD COLUMN     "education_level" TEXT,
ADD COLUMN     "has_completed_onboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "introduction" TEXT;
