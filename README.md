# cotacoes

Sistema web para gestão de cotação de equipamentos hospitalares (Next.js, Prisma, PostgreSQL).

Repositório: https://github.com/leandroborgeseng/cotacoes

## Desenvolvimento local

1. Postgres (ex.: `docker compose up -d`)
2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`
3. `npx prisma migrate deploy`
4. `npm run dev` → http://localhost:3000

## Deploy na Railway

1. Crie um projeto na [Railway](https://railway.app) a partir deste repositório.
2. Adicione um plugin **PostgreSQL** e copie a variável `DATABASE_URL` para o serviço da aplicação (ou use a referência automática que a Railway injeta).
3. O arquivo `railway.toml` define o comando de start com migrações antes do servidor.

Variáveis úteis:

| Variável       | Descrição                          |
|----------------|-------------------------------------|
| `DATABASE_URL` | Connection string do Postgres       |

Build padrão: `npm run build`. O `postinstall` executa `prisma generate`.

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — servidor Next.js (produção)
- `npm run db:migrate` — migrações em dev (`prisma migrate dev`)
