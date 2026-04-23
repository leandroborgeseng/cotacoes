import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não está definida.");
  }
  if (process.env.NODE_ENV === "production" && url.startsWith("file:") && url.startsWith("file:./")) {
    console.warn(
      "[prisma] DATABASE_URL usa caminho relativo (file:./…). Em Docker/PaaS sem volume persistente o SQLite é apagado a cada deploy. " +
        "Use caminho absoluto + volume, ex.: file:/app/data/cotacoes.db e monte /app/data. Ver README.md (Deploy).",
    );
  }
  return url;
}

function createPrisma() {
  const url = requireDatabaseUrl();
  const adapter = new PrismaBetterSqlite3(
    { url },
    { shadowDatabaseUrl: ":memory:" },
  );
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
