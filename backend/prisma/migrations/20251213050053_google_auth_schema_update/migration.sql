/*
  Warnings:

  - You are about to drop the column `password_hash` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "password_hash",
ADD COLUMN     "google_id" TEXT,
ADD COLUMN     "profile_picture" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
