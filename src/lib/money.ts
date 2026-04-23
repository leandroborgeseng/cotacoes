import { Prisma } from "@/generated/prisma/client";

export function decimalFromNumber(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

export function totalFromUnit(quantidade: number, valorUnitario: Prisma.Decimal | number): Prisma.Decimal {
  const q = new Prisma.Decimal(quantidade);
  const u = typeof valorUnitario === "number" ? new Prisma.Decimal(valorUnitario) : valorUnitario;
  return q.mul(u);
}
