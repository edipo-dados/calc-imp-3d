# Deploy — Calculadora 3D

Este projeto usa uma arquitetura monorepo com deploy separado para frontend e backend.

## Arquitetura de Deploy

- **Backend**: Vercel Serverless Functions + Supabase (PostgreSQL)
- **Frontend**: Vercel (Vite/React)

---

## 1. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **Settings → Database** e copie a connection string (URI)
3. O formato será: `postgresql://postgres:[SENHA]@db.[REF].supabase.co:5432/postgres`

---

## 2. Deploy do Backend (Vercel)

1. No Vercel, importe o repositório apontando para a pasta `calculadora-3d/server`
2. Configurações:
   - **Root Directory**: `calculadora-3d/server`
   - **Build Command**: `prisma generate`
   - **Output Directory**: (deixe vazio)
   - **Framework Preset**: Other

3. Configure as variáveis de ambiente:
   - `DATABASE_URL` = sua connection string do Supabase

4. Após o primeiro deploy, rode a migration (via CLI Vercel ou Supabase SQL Editor):
   ```sql
   CREATE TABLE "Filamento" (
     "id" SERIAL PRIMARY KEY,
     "nome" TEXT NOT NULL,
     "precoPorKg" DOUBLE PRECISION NOT NULL,
     "densidade" DOUBLE PRECISION,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE "Orcamento" (
     "id" SERIAL PRIMARY KEY,
     "nomePeca" TEXT NOT NULL,
     "inputs" JSONB NOT NULL,
     "breakdown" JSONB NOT NULL,
     "precoIdeal" DOUBLE PRECISION NOT NULL,
     "precoMinimo" DOUBLE PRECISION NOT NULL,
     "precoPremium" DOUBLE PRECISION NOT NULL,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
   ```

   Ou use `npx prisma db push` localmente com a DATABASE_URL do Supabase.

---

## 3. Deploy do Frontend (Vercel)

1. No Vercel, importe o repositório apontando para a pasta `calculadora-3d/client`
2. Configurações:
   - **Root Directory**: `calculadora-3d/client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. Configure as variáveis de ambiente:
   - `VITE_API_URL` = URL do backend deployado (ex: `https://calculadora-3d-server.vercel.app/api`)

---

## 4. Desenvolvimento Local

```bash
# Terminal 1 — Backend
cd server
cp .env.example .env
# Edite .env com sua DATABASE_URL (local ou Supabase)
npx prisma generate
npx prisma db push
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

O proxy do Vite redireciona `/api` para `localhost:3001` em dev.

---

## Variáveis de Ambiente

### Backend (server/)
| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL (Supabase) |

### Frontend (client/)
| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL base da API (produção). Em dev, usa proxy local. |

---

## Notas

- O backend exporta o Express app como serverless function em `api/index.ts`
- O schema Prisma usa `Json` type (JSONB no PostgreSQL) para `inputs` e `breakdown`
- Em produção, o frontend precisa do `VITE_API_URL` apontando para o backend
- O `vercel-build` script no server roda `prisma generate` automaticamente
