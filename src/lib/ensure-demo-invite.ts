import { prisma } from "@/lib/prisma";

const TEXTO =
  "Este processo refere-se a uma pré-cotação de equipamentos hospitalares com objetivo de levantamento de mercado. Existe a possibilidade de fechamento durante a Feira Hospitalar. Caso o representante esteja presente na feira, favor informar os dados abaixo.";

const HOSPITAL = {
  nome: "São Joaquim Hospital e Maternidade",
  cnpj: "50.486.026/0001-60",
  cidade: "Franca",
  uf: "SP",
} as const;

export const DEMO_CONVITE_TOKEN = "demo-convite-local";

const EQUIPAMENTOS = [
  {
    nome: "Monitor multiparamétrico",
    descricao: "Monitor de sinais vitais com PNI e SpO2.",
    quantidade: 10,
    categoria: "Monitoramento",
    criticidade: "alta",
  },
  {
    nome: "Bomba de infusão volumétrica",
    descricao: "Bomba com biblioteca de medicamentos e alarmes.",
    quantidade: 25,
    categoria: "Infusão",
    criticidade: "alta",
  },
  {
    nome: "Cama hospitalar elétrica",
    descricao: "Cama com acionamento elétrico e grades.",
    quantidade: 5,
    categoria: "Leitos",
    criticidade: "média",
  },
] as const;

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
        titulo: "Pré-Cotação Hospitalar",
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
        titulo: "Pré-Cotação Hospitalar",
      },
    });
  }

  const qtd = await prisma.equipamento.count({ where: { hospitalId: hospital.id } });
  if (qtd === 0) {
    await prisma.equipamento.createMany({
      data: EQUIPAMENTOS.map((e) => ({ ...e, hospitalId: hospital.id })),
    });
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
      titulo: "Pré-Cotação Hospitalar",
      textoIntro: TEXTO,
    },
  });
  await prisma.equipamento.createMany({
    data: EQUIPAMENTOS.map((e) => ({ ...e, hospitalId: hospital.id })),
  });
}
