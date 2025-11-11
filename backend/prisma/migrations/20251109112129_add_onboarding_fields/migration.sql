-- AlterTable
ALTER TABLE "users" ADD COLUMN     "background" TEXT,
ADD COLUMN     "goals" TEXT,
ADD COLUMN     "has_completed_onboarding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "learning_interests" TEXT;
