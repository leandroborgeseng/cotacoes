import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TEXTO_PADRAO =
  "Este processo refere-se a uma pré-cotação de equipamentos hospitalares com objetivo de levantamento de mercado. Existe a possibilidade de fechamento durante a Feira Hospitalar. Caso o representante esteja presente na feira, favor informar os dados abaixo.";

export async function POST(req: Request) {
  const body = (await req.json()) as { hospitalId?: string; titulo?: string; textoIntro?: string };
  if (!body.hospitalId) {
    return NextResponse.json({ error: "hospitalId obrigatório." }, { status: 400 });
  }
  const token = randomBytes(16).toString("hex");
  const convite = await prisma.conviteCotacao.create({
    data: {
      token,
      hospitalId: body.hospitalId,
      titulo: body.titulo?.trim() || "Pré-Cotação Feira Hospitalar",
      textoIntro: body.textoIntro?.trim() || TEXTO_PADRAO,
    },
  });
  return NextResponse.json(convite);
}
