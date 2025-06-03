-- DropForeignKey
ALTER TABLE "Bird" DROP CONSTRAINT "Bird_order_id_fkey";

-- AlterTable
ALTER TABLE "Bird" ALTER COLUMN "order_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Bird" ADD CONSTRAINT "Bird_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "BirdOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
