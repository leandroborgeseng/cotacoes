-- AlterTable
ALTER TABLE "Equipamento" ADD COLUMN "valorTotalOrcado" DECIMAL(12,2);
ALTER TABLE "Equipamento" ADD COLUMN "previsaoAquisicao" INTEGER;
ALTER TABLE "Equipamento" ADD COLUMN "justificativa" TEXT NOT NULL DEFAULT '';
