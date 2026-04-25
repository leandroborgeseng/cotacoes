const map: Record<string, string> = {
  A_VISTA: "À vista",
  FATURADO_30_60_90: "Faturado 30/60/90",
  OUTRO: "Outro",
};

export function condicaoPagamentoLabel(codigo: string): string {
  return map[codigo] ?? codigo;
}
