-- AlterTable
ALTER TABLE "Equipamento" ADD COLUMN "publicarCotacao" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Equipamento_publicarCotacao_idx" ON "Equipamento"("publicarCotacao");
