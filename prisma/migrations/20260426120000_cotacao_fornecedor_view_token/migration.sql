-- Link único para o fornecedor visualizar a cotação enviada (e-mail de confirmação).
ALTER TABLE "Cotacao" ADD COLUMN "fornecedorViewToken" TEXT;

CREATE UNIQUE INDEX "Cotacao_fornecedorViewToken_key" ON "Cotacao"("fornecedorViewToken");
