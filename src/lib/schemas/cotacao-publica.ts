import { z } from "zod";
import { cnpjDigitCount } from "@/lib/format-cnpj";

export const condicaoPagamentoEnum = z.enum(["A_VISTA", "FATURADO_30_60_90", "OUTRO"]);

export const cotacaoItemPayload = z.object({
  equipamentoId: z.string().min(1),
  precoUnitario: z.coerce.number().positive(),
  prazoEntrega: z.coerce.number().int().min(1),
  condicoesPagamento: condicaoPagamentoEnum,
  condicoesPagamentoDetalhe: z.string().max(2000).optional().default(""),
  observacoes: z.string().max(4000).optional().default(""),
});

export const cotacaoPublicaPayload = z
  .object({
    token: z.string().min(8),
    fornecedorNome: z.string().min(2).max(200),
    fornecedorCnpj: z
      .string()
      .max(22)
      .refine((s) => cnpjDigitCount(s) === 14, "CNPJ deve ter 14 dígitos."),
    representanteNome: z.string().min(2).max(200),
    telefone: z.string().min(8).max(30),
    email: z.string().email().max(200),
    feira: z.boolean(),
    feiraNome: z.string().max(200).optional().default(""),
    stand: z.string().max(100).optional().default(""),
    feiraLocalizacao: z.string().max(300).optional().default(""),
    itens: z.array(cotacaoItemPayload).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.feira) {
      if (!data.feiraNome?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o nome da feira.", path: ["feiraNome"] });
      }
      if (!data.stand?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe o número do stand.", path: ["stand"] });
      }
    }
  });

export type CotacaoPublicaInput = z.infer<typeof cotacaoPublicaPayload>;
