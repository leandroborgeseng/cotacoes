import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { MAX_PDF_BYTES } from "@/lib/pdf-constants";
import { assertPdfMagic, saveCotacaoPdf } from "@/lib/pdf-upload";
import { prisma } from "@/lib/prisma";
import { cotacaoPublicaPayload } from "@/lib/schemas/cotacao-publica";
import { sendFornecedorCotacaoConfirmacao } from "@/lib/send-fornecedor-cotacao-email";

export async function POST(req: Request) {
  const form = await req.formData();
  const raw = form.get("payload");
  const file = form.get("pdf");

  if (typeof raw !== "string") {
    return NextResponse.json({ error: "Campo payload ausente." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF obrigatório." }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF acima de 10MB." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Apenas arquivos PDF são aceitos." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (!assertPdfMagic(buf)) {
    return NextResponse.json({ error: "Arquivo PDF inválido." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Payload JSON inválido." }, { status: 400 });
  }

  const parsed = cotacaoPublicaPayload.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const convite = await prisma.conviteCotacao.findFirst({
    where: { token: data.token, ativo: true },
    include: { hospital: true },
  });
  if (!convite) {
    return NextResponse.json({ error: "Convite inválido." }, { status: 404 });
  }

  const equipIds = new Set(data.itens.map((i) => i.equipamentoId));
  const equipamentos = await prisma.equipamento.findMany({
    where: { hospitalId: convite.hospitalId, id: { in: [...equipIds] }, ativo: true },
  });
  if (equipamentos.length !== equipIds.size) {
    return NextResponse.json({ error: "Itens inválidos ou inativos." }, { status: 400 });
  }

  const cotacaoId = randomUUID();
  const fornecedorViewToken = randomBytes(24).toString("hex");
  const baseUrl = getAppBaseUrl();
  const minhaCotacaoUrl = `${baseUrl}/minha-cotacao/${fornecedorViewToken}`;

  try {
    const pdfPath = await saveCotacaoPdf(cotacaoId, buf);

    await prisma.$transaction(async (tx) => {
      await tx.cotacao.create({
        data: {
          id: cotacaoId,
          conviteId: convite.id,
          fornecedorNome: data.fornecedorNome,
          fornecedorCnpj: data.fornecedorCnpj,
          representanteNome: data.representanteNome,
          telefone: data.telefone,
          email: data.email,
          feira: data.feira,
          feiraNome: data.feiraNome ?? "",
          stand: data.stand ?? "",
          feiraLocalizacao: data.feiraLocalizacao ?? "",
          arquivoPdf: pdfPath,
          fornecedorViewToken,
          itens: {
            create: data.itens.map((it) => ({
              equipamentoId: it.equipamentoId,
              precoUnitario: new Prisma.Decimal(it.precoUnitario),
              prazoEntrega: it.prazoEntrega,
              condicoesPagamento: it.condicoesPagamento,
              condicoesPagamentoDetalhe: it.condicoesPagamentoDetalhe ?? "",
              observacoes: it.observacoes ?? "",
            })),
          },
        },
      });
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao salvar cotação." }, { status: 500 });
  }

  let emailSent = false;
  let emailSkipped = false;
  let emailError: string | undefined;

  try {
    const mail = await sendFornecedorCotacaoConfirmacao({
      to: data.email.trim(),
      fornecedorNome: data.fornecedorNome.trim(),
      hospitalNome: convite.hospital.nome,
      conviteTitulo: convite.titulo,
      minhaCotacaoUrl,
    });
    if (mail.skipped) emailSkipped = true;
    else if (mail.ok) emailSent = true;
    else emailError = mail.error;
  } catch (e) {
    console.error("E-mail de confirmação:", e);
    emailError = e instanceof Error ? e.message : "Falha ao enviar e-mail.";
  }

  return NextResponse.json({
    ok: true,
    id: cotacaoId,
    minhaCotacaoUrl,
    emailSent,
    emailSkipped,
    emailError,
  });
}
