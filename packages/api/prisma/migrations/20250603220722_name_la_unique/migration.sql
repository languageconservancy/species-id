/*
  Warnings:

  - A unique constraint covering the columns `[name_la]` on the table `Bird` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bird_name_la_key" ON "Bird"("name_la");
