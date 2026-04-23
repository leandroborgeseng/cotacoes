FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# O postinstall roda `prisma generate` — precisa do schema antes do `npm ci`
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm ci

COPY . .

# Banco temporário só para build (migrate + Next)
ENV DATABASE_URL=file:./prisma/build.db
RUN npx prisma migrate deploy && npm run build

# Em runtime o arquivo SQLite fica no volume /data (ver docker-compose)
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/cotacoes.db

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && exec npx next start -H 0.0.0.0 -p 3000"]
