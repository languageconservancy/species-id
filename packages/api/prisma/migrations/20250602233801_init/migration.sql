-- CreateEnum
CREATE TYPE "BirdColor" AS ENUM ('BLACK', 'WHITE', 'BROWN', 'GRAY', 'RED', 'YELLOW', 'BLUE', 'GREEN', 'ORANGE', 'PINK', 'PURPLE');

-- CreateEnum
CREATE TYPE "TaxonSource" AS ENUM ('INATURALIST', 'BIRDNET', 'PLANT_ID', 'CUSTOM_UPLOAD');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('BIRD', 'PLANT');

-- CreateTable
CREATE TABLE "Plant" (
    "id" SERIAL NOT NULL,
    "name_local" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_la" TEXT NOT NULL,
    "description_local" TEXT,
    "description_en" TEXT,
    "name_meaning_en" TEXT,
    "order" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bird" (
    "id" SERIAL NOT NULL,
    "name_local" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_la" TEXT NOT NULL,
    "name_meaning_en" TEXT,
    "order" TEXT NOT NULL,
    "colors" "BirdColor"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bird_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonMapping" (
    "id" SERIAL NOT NULL,
    "source" "TaxonSource" NOT NULL,
    "external_id" TEXT NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BirdTaxonMapping" (
    "id" SERIAL NOT NULL,
    "taxon_map_id" INTEGER NOT NULL,
    "bird_id" INTEGER NOT NULL,

    CONSTRAINT "BirdTaxonMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantTaxonMapping" (
    "id" SERIAL NOT NULL,
    "taxon_map_id" INTEGER NOT NULL,
    "plant_id" INTEGER NOT NULL,

    CONSTRAINT "PlantTaxonMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BirdTaxonMapping_taxon_map_id_key" ON "BirdTaxonMapping"("taxon_map_id");

-- CreateIndex
CREATE UNIQUE INDEX "BirdTaxonMapping_bird_id_key" ON "BirdTaxonMapping"("bird_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlantTaxonMapping_taxon_map_id_key" ON "PlantTaxonMapping"("taxon_map_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlantTaxonMapping_plant_id_key" ON "PlantTaxonMapping"("plant_id");

-- AddForeignKey
ALTER TABLE "BirdTaxonMapping" ADD CONSTRAINT "BirdTaxonMapping_taxon_map_id_fkey" FOREIGN KEY ("taxon_map_id") REFERENCES "TaxonMapping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirdTaxonMapping" ADD CONSTRAINT "BirdTaxonMapping_bird_id_fkey" FOREIGN KEY ("bird_id") REFERENCES "Bird"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantTaxonMapping" ADD CONSTRAINT "PlantTaxonMapping_taxon_map_id_fkey" FOREIGN KEY ("taxon_map_id") REFERENCES "TaxonMapping"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantTaxonMapping" ADD CONSTRAINT "PlantTaxonMapping_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
