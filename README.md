# Calculadora de Precificação de Impressão 3D

Aplicação web full-stack para makers e pequenos negócios de impressão 3D calcularem o custo real de cada peça e receberem sugestões de preço de venda (mínimo, ideal e premium).

## Stack

- **Backend:** Node.js + Express + TypeScript
- **Banco de dados:** SQLite via Prisma ORM
- **Frontend:** React + Vite + TypeScript
- **Validação:** Zod (backend e frontend)

## Setup Rápido

### Pré-requisitos

- Node.js 18+
- npm

### 1. Backend (server/)

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run seed    # insere filamentos padrão (PLA, PETG, ABS, TPU, Resina)
npm run dev     # inicia em http://localhost:3001
```

### 2. Frontend (client/)

```bash
cd client
npm install
npm run dev     # inicia em http://localhost:5173
```

O Vite está configurado com proxy para `/api` → `http://localhost:3001`, então não precisa configurar CORS manualmente.

## Variáveis de Ambiente

### Server (`server/.env`)

```
DATABASE_URL="file:./dev.db"
PORT=3001
```

## Scripts Disponíveis

### Server

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor com hot-reload |
| `npm run build` | Compila TypeScript |
| `npm test` | Roda testes unitários (vitest) |
| `npm run seed` | Insere filamentos padrão no banco |

### Client

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia Vite dev server |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/orcamentos/calcular` | Calcula preço sem salvar |
| POST | `/api/orcamentos` | Salva um orçamento |
| GET | `/api/orcamentos` | Lista orçamentos |
| GET | `/api/orcamentos/:id` | Detalhe de orçamento |
| DELETE | `/api/orcamentos/:id` | Remove orçamento |
| GET | `/api/filamentos` | Lista filamentos |
| POST | `/api/filamentos` | Cria filamento |

## Fórmulas de Cálculo

```
custoFilamento   = (pesoGramas / 1000) × precoPorKg × (1 + desperdício / 100)
custoEnergia     = (potênciaWatts / 1000) × horasImpressão × tarifaKwh
custoDepreciação = (valorImpressora / vidaÚtilHoras) × horasImpressão
custoManutenção  = manutençãoPorHora × horasImpressão
custoMãoDeObra   = horasTrabalho × valorHora
custoFixoRateado = custoFixoMensal / impressõesPorMês

subtotal         = soma de todos os custos
fatorFalha       = 1 / (1 - taxaFalha / 100)
custoComFalha    = subtotal × fatorFalha

preçoIdeal       = custoComFalha × (1 + margem / 100)
preçoMínimo      = custoComFalha × (1 + max(margem - 25, 5) / 100)
preçoPremium     = custoComFalha × (1 + (margem + 40) / 100)
```

## Prisma Migrations

```bash
cd server
npx prisma db push          # Aplica schema ao banco
npx prisma studio           # Interface visual do banco (opcional)
npx prisma generate         # Regenera o client (após mudar schema)
```

## Testes

```bash
cd server
npm test
```

Cobertura inclui:
- Cálculo com valores conhecidos
- Taxa de falha 0% e 90%
- Custos zerados
- Cálculo reverso (margem a partir de preço)
