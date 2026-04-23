FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# O postinstall roda `prisma generate` — precisa do schema antes do `npm ci`
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci

COPY . .
# Garante client após o COPY (arquivos gerados não vão no Git)
RUN npx prisma generate

# Banco temporário só para build (migrate + Next)
ENV DATABASE_URL=file:./prisma/build.db
RUN npx prisma migrate deploy && npm run build

# Runtime: SQLite em disco gravável dentro da imagem (Railway não monta /data por padrão)
ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/cotacoes.db

# Railway injeta PORT; localmente 3000
EXPOSE 3000
CMD ["sh", "-c", "mkdir -p data && npx prisma migrate deploy && npx prisma db seed && exec npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
