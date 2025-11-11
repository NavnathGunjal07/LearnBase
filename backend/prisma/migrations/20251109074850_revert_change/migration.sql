/*
  Warnings:

  - You are about to drop the column `education_level` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `has_completed_onboarding` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `introduction` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "education_level",
DROP COLUMN "has_completed_onboarding",
DROP COLUMN "introduction";
