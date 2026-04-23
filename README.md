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

O **Dockerfile** grava o SQLite em **`/app/data/cotacoes.db`** (diretório criado no start). Na Railway **não** existe volume em `/data` como no `docker-compose` local; usar `file:/data/...` quebrava o container e gerava **502**.

O disco do container na Railway é **efêmero** (dados somem a cada redeploy). Para produção estável na nuvem, o usual é **PostgreSQL** ou banco gerenciado (Turso/libSQL, etc.).

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
