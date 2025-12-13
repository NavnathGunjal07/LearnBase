-- AlterTable
ALTER TABLE "master_topics" ADD COLUMN     "created_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "master_topics" ADD CONSTRAINT "master_topics_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
