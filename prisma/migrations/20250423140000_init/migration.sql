-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('rascunho', 'pronto_para_cotacao', 'enviado', 'cotado');

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "nome_padronizado" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT NOT NULL DEFAULT '',
    "descricao_original" TEXT NOT NULL DEFAULT '',
    "descricao_editavel" TEXT NOT NULL DEFAULT '',
    "requisitos_minimos" JSONB NOT NULL DEFAULT '[]',
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "valor_estimado" DECIMAL(14,2) NOT NULL,
    "valor_total_estimado" DECIMAL(14,2) NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'rascunho',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

-- CreateIndex
CREATE INDEX "Equipment_categoria_idx" ON "Equipment"("categoria");

-- CreateIndex
CREATE INDEX "Equipment_ativo_idx" ON "Equipment"("ativo");
