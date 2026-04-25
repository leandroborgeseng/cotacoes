import { prisma } from "@/lib/prisma";
import { dadosCatalogoCreateMany, SEED_EQUIPAMENTOS_GENERICOS } from "@/lib/catalogo-equipamentos-oficial";
import { equipamentoFromImportRow } from "@/lib/equipamento-map";

const TEXTO =
  "Este processo refere-se a uma pré-cotação de equipamentos hospitalares com objetivo de levantamento de mercado. Existe a possibilidade de fechamento durante a Feira Hospitalar. Caso o representante esteja presente na feira, favor informar os dados abaixo.";

const HOSPITAL = {
  nome: "São Joaquim Hospital e Maternidade",
  cnpj: "45.309.606/0003-03",
  cidade: "Franca",
  uf: "SP",
} as const;

export const DEMO_CONVITE_TOKEN = "demo-convite-local";

async function syncDemoCatalog(hospitalId: string): Promise<void> {
  const data = dadosCatalogoCreateMany(hospitalId);
  const importRefs = data.map((row) => row.importRef).filter((ref): ref is string => Boolean(ref));
  const importRefSet = new Set(importRefs);

  for (const row of data) {
    const existing = row.importRef
      ? await prisma.equipamento.findFirst({
          where: {
            hospitalId,
            importRef: row.importRef,
          },
          select: { id: true },
        })
      : null;

    if (existing) {
      await prisma.equipamento.update({
        where: { id: existing.id },
        data: row,
      });
    } else {
      await prisma.equipamento.create({
        data: {
          ...row,
          ativo: true,
        },
      });
    }
  }

  const antigos = await prisma.equipamento.findMany({
    where: { hospitalId },
    select: {
      id: true,
      importRef: true,
    },
  });
  const idsAntigos = antigos
    .filter((eq) => !eq.importRef || !importRefSet.has(eq.importRef))
    .map((eq) => eq.id);

  if (idsAntigos.length > 0) {
    await prisma.equipamento.updateMany({
      where: { id: { in: idsAntigos } },
      data: { ativo: false },
    });
  }
}

/**
 * Garante hospital, convite demo e equipamentos (idempotente).
 * Usado no seed e na API pública para deploys onde `db seed` não roda.
 */
export async function ensureDemoInvite(): Promise<void> {
  let hospital = await prisma.hospital.findFirst({ where: { cnpj: HOSPITAL.cnpj } });
  if (!hospital) {
    hospital = await prisma.hospital.create({ data: { ...HOSPITAL } });
  }

  const convite = await prisma.conviteCotacao.findFirst({ where: { token: DEMO_CONVITE_TOKEN } });
  if (!convite) {
    await prisma.conviteCotacao.create({
      data: {
        token: DEMO_CONVITE_TOKEN,
        hospitalId: hospital.id,
        titulo: "Pré-Cotação Feira Hospitalar",
        textoIntro: TEXTO,
        ativo: true,
      },
    });
  } else if (!convite.ativo || convite.hospitalId !== hospital.id) {
    await prisma.conviteCotacao.update({
      where: { id: convite.id },
      data: {
        ativo: true,
        hospitalId: hospital.id,
        textoIntro: TEXTO,
        titulo: "Pré-Cotação Feira Hospitalar",
      },
    });
  }

  if (hospital.cnpj === HOSPITAL.cnpj) {
    await syncDemoCatalog(hospital.id);
  } else {
    const qtd = await prisma.equipamento.count({ where: { hospitalId: hospital.id } });
    if (qtd === 0) {
      const data = SEED_EQUIPAMENTOS_GENERICOS.map((e) =>
        equipamentoFromImportRow(e as unknown as Record<string, unknown>, hospital.id),
      );
      await prisma.equipamento.createMany({ data });
    }
  }
}

/** Apaga cotações, convites, equipamentos e hospitais e recria o demo (SEED_RESET=true). */
export async function resetAndSeedFull(): Promise<void> {
  await prisma.cotacaoItem.deleteMany();
  await prisma.cotacao.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.conviteCotacao.deleteMany();
  await prisma.hospital.deleteMany();

  const hospital = await prisma.hospital.create({ data: { ...HOSPITAL } });
  await prisma.conviteCotacao.create({
    data: {
      token: DEMO_CONVITE_TOKEN,
      hospitalId: hospital.id,
      titulo: "Pré-Cotação Feira Hospitalar",
      textoIntro: TEXTO,
    },
  });
  await prisma.equipamento.createMany({
    data: dadosCatalogoCreateMany(hospital.id),
  });
}
