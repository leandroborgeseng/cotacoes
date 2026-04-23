import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get("hospitalId");
  if (!hospitalId) {
    return NextResponse.json({ error: "hospitalId obrigatório." }, { status: 400 });
  }
  const rows = await prisma.equipamento.findMany({
    where: { hospitalId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    hospitalId?: string;
    nome?: string;
    descricao?: string;
    quantidade?: number;
    categoria?: string;
    criticidade?: string;
  };
  if (!body.hospitalId || !body.nome?.trim()) {
    return NextResponse.json({ error: "hospitalId e nome são obrigatórios." }, { status: 400 });
  }
  const row = await prisma.equipamento.create({
    data: {
      hospitalId: body.hospitalId,
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() ?? "",
      quantidade: Math.max(1, Math.floor(Number(body.quantidade) || 1)),
      categoria: body.categoria?.trim() ?? "",
      criticidade: body.criticidade?.trim() ?? "",
    },
  });
  return NextResponse.json(row);
}
