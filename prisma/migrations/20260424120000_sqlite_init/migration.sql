-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConviteCotacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Pré-Cotação Hospitalar',
    "textoIntro" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConviteCotacao_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Equipamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hospitalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL DEFAULT '',
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "categoria" TEXT NOT NULL DEFAULT '',
    "criticidade" TEXT NOT NULL DEFAULT '',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Equipamento_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cotacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conviteId" TEXT NOT NULL,
    "fornecedorNome" TEXT NOT NULL,
    "fornecedorCnpj" TEXT NOT NULL,
    "representanteNome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "feira" BOOLEAN NOT NULL DEFAULT false,
    "feiraNome" TEXT NOT NULL DEFAULT '',
    "stand" TEXT NOT NULL DEFAULT '',
    "feiraLocalizacao" TEXT NOT NULL DEFAULT '',
    "arquivoPdf" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cotacao_conviteId_fkey" FOREIGN KEY ("conviteId") REFERENCES "ConviteCotacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CotacaoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cotacaoId" TEXT NOT NULL,
    "equipamentoId" TEXT NOT NULL,
    "precoUnitario" DECIMAL NOT NULL,
    "prazoEntrega" INTEGER NOT NULL,
    "condicoesPagamento" TEXT NOT NULL,
    "condicoesPagamentoDetalhe" TEXT NOT NULL DEFAULT '',
    "observacoes" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "CotacaoItem_cotacaoId_fkey" FOREIGN KEY ("cotacaoId") REFERENCES "Cotacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CotacaoItem_equipamentoId_fkey" FOREIGN KEY ("equipamentoId") REFERENCES "Equipamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Hospital_cnpj_idx" ON "Hospital"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "ConviteCotacao_token_key" ON "ConviteCotacao"("token");

-- CreateIndex
CREATE INDEX "ConviteCotacao_hospitalId_idx" ON "ConviteCotacao"("hospitalId");

-- CreateIndex
CREATE INDEX "Equipamento_hospitalId_idx" ON "Equipamento"("hospitalId");

-- CreateIndex
CREATE INDEX "Equipamento_ativo_idx" ON "Equipamento"("ativo");

-- CreateIndex
CREATE INDEX "Cotacao_conviteId_idx" ON "Cotacao"("conviteId");

-- CreateIndex
CREATE INDEX "Cotacao_fornecedorCnpj_idx" ON "Cotacao"("fornecedorCnpj");

-- CreateIndex
CREATE INDEX "Cotacao_createdAt_idx" ON "Cotacao"("createdAt");

-- CreateIndex
CREATE INDEX "CotacaoItem_cotacaoId_idx" ON "CotacaoItem"("cotacaoId");

-- CreateIndex
CREATE INDEX "CotacaoItem_equipamentoId_idx" ON "CotacaoItem"("equipamentoId");
