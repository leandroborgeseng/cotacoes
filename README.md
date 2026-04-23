# cotacoes

Sistema web para gestão de cotação de equipamentos hospitalares (Next.js, Prisma, **SQLite**).

Repositório: https://github.com/leandroborgeseng/cotacoes

## Desenvolvimento local (sem Docker)

1. Copie `.env.example` para `.env` (já aponta para `file:./prisma/dev.db`).
2. `npx prisma migrate deploy`
3. `npm run dev` → http://localhost:3000

O arquivo `prisma/dev.db` é criado automaticamente e está no `.gitignore`.

## Um único container (app + SQLite)

O `docker-compose.yml` sobe **só o serviço `app`**: Next.js + Prisma + arquivo SQLite em volume **`/data/cotacoes.db`** (persistente entre reinícios do container).

```bash
docker compose up --build
```

Abra http://localhost:3000

Requisitos: build com `better-sqlite3` precisa de toolchain nativa (o `Dockerfile` usa `python3`, `make`, `g++` no Debian slim).

## Deploy na Railway

Este projeto está configurado para **SQLite em arquivo**. Na Railway o disco do container costuma ser **efêmero** (dados somem no redeploy). Para produção na nuvem o caminho usual é voltar a **PostgreSQL** ou usar banco gerenciado (Turso/libSQL, etc.).

Se você voltar a usar Postgres no futuro, ajuste `prisma/schema.prisma`, o adaptador em `src/lib/prisma.ts` e a `DATABASE_URL`.

## Variáveis

| Variável       | Exemplo                         |
|----------------|----------------------------------|
| `DATABASE_URL` | `file:./prisma/dev.db` (local)   |
|                | `file:/data/cotacoes.db` (Docker)|

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — servidor Next.js
- `npm run db:migrate` — `prisma migrate dev`

O `postinstall` executa `prisma generate`.
