-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "import_ref" TEXT;
ALTER TABLE "Equipment" ADD COLUMN     "nome_original" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipment" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipment" ADD COLUMN     "setor_hospitalar" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipment" ADD COLUMN     "anvisa_classe" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Equipment" ADD COLUMN     "criticidade" TEXT NOT NULL DEFAULT '';
