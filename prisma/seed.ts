import { prisma } from "../src/lib/prisma";

const TEXTO =
  "Este processo refere-se a uma pré-cotação de equipamentos hospitalares com objetivo de levantamento de mercado. Existe a possibilidade de fechamento durante a Feira Hospitalar. Caso o representante esteja presente na feira, favor informar os dados abaixo.";

async function main() {
  await prisma.cotacaoItem.deleteMany();
  await prisma.cotacao.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.conviteCotacao.deleteMany();
  await prisma.hospital.deleteMany();

  const hospital = await prisma.hospital.create({
    data: {
      nome: "São Joaquim Hospital e Maternidade",
      cnpj: "50.486.026/0001-60",
      cidade: "Franca",
      uf: "SP",
    },
  });

  const convite = await prisma.conviteCotacao.create({
    data: {
      token: "demo-convite-local",
      hospitalId: hospital.id,
      titulo: "Pré-Cotação Hospitalar",
      textoIntro: TEXTO,
    },
  });

  await prisma.equipamento.createMany({
    data: [
      {
        hospitalId: hospital.id,
        nome: "Monitor multiparamétrico",
        descricao: "Monitor de sinais vitais com PNI e SpO2.",
        quantidade: 10,
        categoria: "Monitoramento",
        criticidade: "alta",
      },
      {
        hospitalId: hospital.id,
        nome: "Bomba de infusão volumétrica",
        descricao: "Bomba com biblioteca de medicamentos e alarmes.",
        quantidade: 25,
        categoria: "Infusão",
        criticidade: "alta",
      },
      {
        hospitalId: hospital.id,
        nome: "Cama hospitalar elétrica",
        descricao: "Cama com acionamento elétrico e grades.",
        quantidade: 5,
        categoria: "Leitos",
        criticidade: "média",
      },
    ],
  });

  console.log("Seed OK. Hospital:", hospital.id);
  console.log("Link fornecedor:", `/c/${convite.token}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
