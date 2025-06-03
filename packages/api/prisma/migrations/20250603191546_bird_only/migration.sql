/*
  Warnings:

  - You are about to drop the column `order` on the `Bird` table. All the data in the column will be lost.
  - You are about to drop the column `plant_id` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the `Plant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlantTaxonMapping` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `order_id` to the `Bird` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_plant_id_fkey";

-- DropForeignKey
ALTER TABLE "PlantTaxonMapping" DROP CONSTRAINT "PlantTaxonMapping_plant_id_fkey";

-- DropForeignKey
ALTER TABLE "PlantTaxonMapping" DROP CONSTRAINT "PlantTaxonMapping_taxon_map_id_fkey";

-- AlterTable
ALTER TABLE "Bird" DROP COLUMN "order",
ADD COLUMN     "order_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "plant_id",
ADD COLUMN     "bird_order_id" INTEGER;

-- DropTable
DROP TABLE "Plant";

-- DropTable
DROP TABLE "PlantTaxonMapping";

-- CreateTable
CREATE TABLE "BirdOrder" (
    "id" SERIAL NOT NULL,
    "name_la" TEXT NOT NULL,
    "description_en" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BirdOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BirdOrderImages" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "bird_order_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,

    CONSTRAINT "BirdOrderImages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BirdOrderImages_bird_order_id_media_id_key" ON "BirdOrderImages"("bird_order_id", "media_id");

-- AddForeignKey
ALTER TABLE "Bird" ADD CONSTRAINT "Bird_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "BirdOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirdOrderImages" ADD CONSTRAINT "BirdOrderImages_bird_order_id_fkey" FOREIGN KEY ("bird_order_id") REFERENCES "BirdOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirdOrderImages" ADD CONSTRAINT "BirdOrderImages_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
