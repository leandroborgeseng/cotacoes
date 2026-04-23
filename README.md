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

## Deploy na Railway (SQLite sem perder dados)

O disco do **container** some a cada redeploy, **a menos** que o arquivo do banco fique em um **volume persistente**.

1. No serviço → **Settings** → **Volumes** → **Add volume** (ex.: nome `sqlite`).
2. **Mount path** exatamente: **`/app/data`** (tem que bater com o `Dockerfile`).
3. **Não** sobrescreva `DATABASE_URL` no painel, a menos que saiba o que está fazendo. O padrão da imagem é `file:/app/data/cotacoes.db`.
4. Redeploy: migrações rodam no boot; os dados permanecem no volume.

Se **não** criar o volume, o comportamento é um banco novo a cada deploy (parece “apagou tudo”). Para escalar ou evitar SQLite na nuvem, migre para **PostgreSQL** (Neon, Supabase, etc.) e troque `DATABASE_URL`.

### 502 / Bad Gateway na Railway

- O **`railway.toml` com `startCommand = npm run start`** fazia o deploy **ignorar o CMD do Dockerfile** e subir o Next só em **localhost** → o proxy não alcança o processo (**502**). Esse arquivo foi removido; use o **CMD da imagem** (ou, na UI do serviço, deixe o **Custom Start Command** vazio).
- O script **`npm run start`** agora usa **`next start -H 0.0.0.0`** para escutar em todas as interfaces. A Railway continua definindo **`PORT`**; o Next usa essa variável automaticamente.

## Variáveis

| Variável       | Exemplo                         |
|----------------|----------------------------------|
| `DATABASE_URL` | `file:./prisma/dev.db` (local)        |
|                | `file:/app/data/cotacoes.db` (Docker / Railway com volume em `/app/data`) |

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — servidor Next.js
- `npm run db:migrate` — `prisma migrate dev`

O `postinstall` executa `prisma generate`.
