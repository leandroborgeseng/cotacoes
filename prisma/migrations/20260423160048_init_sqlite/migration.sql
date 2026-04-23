-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "import_ref" TEXT,
    "nome_padronizado" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL DEFAULT '',
    "tipo" TEXT NOT NULL DEFAULT '',
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT NOT NULL DEFAULT '',
    "setor_hospitalar" TEXT NOT NULL DEFAULT '',
    "anvisa_classe" TEXT NOT NULL DEFAULT '',
    "criticidade" TEXT NOT NULL DEFAULT '',
    "descricao_original" TEXT NOT NULL DEFAULT '',
    "descricao_editavel" TEXT NOT NULL DEFAULT '',
    "requisitos_minimos" JSONB NOT NULL DEFAULT [],
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "valor_estimado" DECIMAL NOT NULL,
    "valor_total_estimado" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

-- CreateIndex
CREATE INDEX "Equipment_categoria_idx" ON "Equipment"("categoria");

-- CreateIndex
CREATE INDEX "Equipment_ativo_idx" ON "Equipment"("ativo");
