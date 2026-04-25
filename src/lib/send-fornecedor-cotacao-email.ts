type SendParams = {
  to: string;
  fornecedorNome: string;
  hospitalNome: string;
  conviteTitulo: string;
  minhaCotacaoUrl: string;
};

/**
 * E-mail de agradecimento após envio da cotação (Resend HTTP API).
 * Configure RESEND_API_KEY e RESEND_FROM (domínio verificado em produção).
 * Sem chave, não envia e retorna ok: false.
 */
export async function sendFornecedorCotacaoConfirmacao(
  params: SendParams,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY não configurada." };
  }

  const from =
    process.env.RESEND_FROM?.trim() || "Pré-cotação <onboarding@resend.dev>";
  const subject = `Recebemos sua cotação — ${params.conviteTitulo}`;
  const text = [
    `Olá, ${params.fornecedorNome},`,
    "",
    `Obrigado por enviar sua proposta para ${params.hospitalNome} (${params.conviteTitulo}).`,
    "",
    `Para conferir o que você enviou (itens, valores e anexo PDF), acesse:`,
    params.minhaCotacaoUrl,
    "",
    "Este link é pessoal e intransferível — guarde-o com segurança.",
    "",
    "Atenciosamente,",
    "Equipe do portal de pré-cotação",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <p>Olá, <strong>${escapeHtml(params.fornecedorNome)}</strong>,</p>
  <p>Obrigado por enviar sua proposta para <strong>${escapeHtml(params.hospitalNome)}</strong>
  (${escapeHtml(params.conviteTitulo)}).</p>
  <p><a href="${escapeAttr(params.minhaCotacaoUrl)}" style="display:inline-block;margin:12px 0;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">Ver o que enviei</a></p>
  <p style="font-size:14px;color:#444;">Ou copie o link:<br /><span style="word-break:break-all;">${escapeHtml(params.minhaCotacaoUrl)}</span></p>
  <p style="font-size:13px;color:#666;">Este link é pessoal — guarde-o com segurança.</p>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return { ok: false, error: errText || `Resend HTTP ${res.status}` };
  }
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
