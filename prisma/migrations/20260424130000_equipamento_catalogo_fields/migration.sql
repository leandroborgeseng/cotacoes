-- AlterTable
ALTER TABLE "Equipamento" ADD COLUMN "importRef" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipamento" ADD COLUMN "nomeOriginal" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipamento" ADD COLUMN "subcategoria" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipamento" ADD COLUMN "setorHospitalar" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipamento" ADD COLUMN "anvisaClasse" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipamento" ADD COLUMN "tipo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipamento" ADD COLUMN "requisitosMinimos" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Equipamento_hospitalId_importRef_idx" ON "Equipamento"("hospitalId", "importRef");
