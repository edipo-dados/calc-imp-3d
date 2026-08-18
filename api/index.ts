import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// === Prisma ===
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// === JWT ===
const JWT_SECRET = process.env.JWT_SECRET || 'calculadora3d-secret-key';

interface AuthPayload {
  id: number;
  email: string;
  role: string;
}

function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

// === Auth Middleware ===
function authRequired(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    if (payload.role === 'pendente') {
      return res.status(403).json({ error: 'Cadastro pendente de aprovação pelo administrador' });
    }
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function adminRequired(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// === Zod Schemas ===
const calculoInputSchema = z.object({
  pesoGramas: z.number().positive(),
  precoPorKg: z.number().positive(),
  desperdicioPercentual: z.number().min(0).max(100),
  potenciaWatts: z.number().nonnegative(),
  horasImpressao: z.number().positive(),
  tarifaKwh: z.number().nonnegative(),
  valorImpressora: z.number().positive(),
  vidaUtilHoras: z.number().positive(),
  manutencaoPorHora: z.number().nonnegative(),
  horasTrabalho: z.number().nonnegative(),
  valorHora: z.number().nonnegative(),
  taxaFalhaPercentual: z.number().min(0).max(90),
  custoFixoMensal: z.number().nonnegative(),
  impressoesPorMes: z.number().positive(),
  margemPercentual: z.number().nonnegative(),
});

const orcamentoCreateSchema = z.object({
  nomePeca: z.string().min(1),
}).merge(calculoInputSchema);

const filamentoCreateSchema = z.object({
  nome: z.string().min(1),
  tipo: z.string().optional().default('PLA'),
  cor: z.string().optional().default('Padrão'),
  precoPorKg: z.number().positive(),
  densidade: z.number().positive().optional(),
  estoqueKg: z.number().nonnegative().optional().default(0),
  estoqueMinKg: z.number().nonnegative().optional().default(0.2),
});

const impressoraCreateSchema = z.object({
  nome: z.string().min(1),
  marca: z.string().optional().default(''),
  modelo: z.string().optional().default(''),
  potenciaWatts: z.number().nonnegative(),
  valorCompra: z.number().positive(),
  vidaUtilHoras: z.number().positive(),
  horasUsadas: z.number().nonnegative().optional().default(0),
  manutencaoPorHora: z.number().nonnegative().optional().default(0),
  taxaFalhaPercentual: z.number().min(0).max(90).optional().default(5),
  volumeMaxX: z.number().positive().optional(),
  volumeMaxY: z.number().positive().optional(),
  volumeMaxZ: z.number().positive().optional(),
  ativa: z.boolean().optional().default(true),
});

const projecaoInputSchema = z.object({
  horasUsoPorMes: z.number().positive(),
  potenciaWatts: z.number().nonnegative(),
  tarifaKwh: z.number().nonnegative(),
  valorImpressora: z.number().positive(),
  vidaUtilHoras: z.number().positive(),
  manutencaoPorHora: z.number().nonnegative(),
  custoFixoMensal: z.number().nonnegative(),
  horasMediaPorPeca: z.number().positive(),
  custoMedioFilamentoPorPeca: z.number().nonnegative(),
  precoMedioVenda: z.number().positive(),
});

// === Calculo Service ===
function calcularPreco(input: z.infer<typeof calculoInputSchema>) {
  const custoFilamento = (input.pesoGramas / 1000) * input.precoPorKg * (1 + input.desperdicioPercentual / 100);
  const custoEnergia = (input.potenciaWatts / 1000) * input.horasImpressao * input.tarifaKwh;
  const custoDepreciacao = (input.valorImpressora / input.vidaUtilHoras) * input.horasImpressao;
  const custoManutencao = input.manutencaoPorHora * input.horasImpressao;
  const custoMaoDeObra = input.horasTrabalho * input.valorHora;
  const custoFixoRateado = input.custoFixoMensal / input.impressoesPorMes;
  const subtotal = custoFilamento + custoEnergia + custoDepreciacao + custoManutencao + custoMaoDeObra + custoFixoRateado;
  const fatorFalha = 1 / (1 - input.taxaFalhaPercentual / 100);
  const custoComFalha = subtotal * fatorFalha;
  const precoIdeal = custoComFalha * (1 + input.margemPercentual / 100);
  const margemMinima = Math.max(input.margemPercentual - 25, 5);
  const precoMinimo = custoComFalha * (1 + margemMinima / 100);
  const precoPremium = custoComFalha * (1 + (input.margemPercentual + 40) / 100);
  return {
    breakdown: { custoFilamento, custoEnergia, custoDepreciacao, custoManutencao, custoMaoDeObra, custoFixoRateado, subtotal, fatorFalha, custoComFalha },
    precoMinimo, precoIdeal, precoPremium,
  };
}

function calcularProjecaoMensal(input: z.infer<typeof projecaoInputSchema>) {
  const custoEnergiaMes = (input.potenciaWatts / 1000) * input.horasUsoPorMes * input.tarifaKwh;
  const custoDepreciacaoMes = (input.valorImpressora / input.vidaUtilHoras) * input.horasUsoPorMes;
  const custoManutencaoMes = input.manutencaoPorHora * input.horasUsoPorMes;
  const custoFixoMes = input.custoFixoMensal;
  const pecasEstimadas = Math.floor(input.horasUsoPorMes / input.horasMediaPorPeca);
  const custoFilamentoTotalMes = pecasEstimadas * input.custoMedioFilamentoPorPeca;
  const custoTotalMes = custoEnergiaMes + custoDepreciacaoMes + custoManutencaoMes + custoFixoMes + custoFilamentoTotalMes;
  const receitaEstimada = pecasEstimadas * input.precoMedioVenda;
  const lucroEstimado = receitaEstimada - custoTotalMes;
  const custoVariavelPorPeca = input.custoMedioFilamentoPorPeca +
    ((input.potenciaWatts / 1000) * input.horasMediaPorPeca * input.tarifaKwh) +
    (input.manutencaoPorHora * input.horasMediaPorPeca) +
    ((input.valorImpressora / input.vidaUtilHoras) * input.horasMediaPorPeca);
  const margemPorPeca = input.precoMedioVenda - custoVariavelPorPeca;
  const pontoEquilibrio = margemPorPeca > 0 ? Math.ceil(custoFixoMes / margemPorPeca) : -1;
  return { custoEnergiaMes, custoDepreciacaoMes, custoManutencaoMes, custoFixoMes, custoTotalMes, pecasEstimadas, custoFilamentoTotalMes, receitaEstimada, lucroEstimado, pontoEquilibrio };
}

// === Express App ===
const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// === AUTH ROUTES ===
app.post('/api/auth/registrar', async (req, res) => {
  try {
    const schema = z.object({ nome: z.string().min(2), email: z.string().email(), senha: z.string().min(6) });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    const { nome, email, senha } = result.data;
    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });
    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await prisma.usuario.create({ data: { nome, email, senha: senhaHash, role: 'pendente' } });
    return res.status(201).json({ message: 'Cadastro realizado. Aguarde aprovação do administrador.', usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Erro interno ao registrar. Verifique a conexão com o banco.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const schema = z.object({ email: z.string().email(), senha: z.string().min(1) });
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
    const { email, senha } = result.data;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(401).json({ error: 'Email ou senha incorretos' });
    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok) return res.status(401).json({ error: 'Email ou senha incorretos' });
    if (usuario.role === 'pendente') return res.status(403).json({ error: 'Cadastro pendente de aprovação pelo administrador' });
    const token = generateToken({ id: usuario.id, email: usuario.email, role: usuario.role });
    return res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno ao fazer login. Verifique a conexão com o banco.' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: (req as any).user.id } });
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role });
});

app.get('/api/auth/pendentes', adminRequired, async (_req, res) => {
  const pendentes = await prisma.usuario.findMany({ where: { role: 'pendente' }, select: { id: true, nome: true, email: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
  return res.json(pendentes);
});

app.post('/api/auth/aprovar/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try { const u = await prisma.usuario.update({ where: { id }, data: { role: 'usuario' } }); return res.json({ message: `${u.nome} aprovado` }); } catch { return res.status(404).json({ error: 'Não encontrado' }); }
});

app.post('/api/auth/rejeitar/:id', adminRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try { await prisma.usuario.delete({ where: { id } }); return res.json({ message: 'Removido' }); } catch { return res.status(404).json({ error: 'Não encontrado' }); }
});

app.get('/api/auth/usuarios', adminRequired, async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({ select: { id: true, nome: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
  return res.json(usuarios);
});

// === ORCAMENTOS ===
app.post('/api/orcamentos/calcular', authRequired, (req, res) => {
  const result = calculoInputSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  return res.json(calcularPreco(result.data));
});

app.post('/api/orcamentos', authRequired, async (req, res) => {
  const result = orcamentoCreateSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const { nomePeca, ...inputs } = result.data;
  const calculo = calcularPreco(inputs);
  const orc = await prisma.orcamento.create({ data: { nomePeca, inputs: inputs as object, breakdown: calculo.breakdown as object, precoMinimo: calculo.precoMinimo, precoIdeal: calculo.precoIdeal, precoPremium: calculo.precoPremium } });
  return res.status(201).json(orc);
});

app.get('/api/orcamentos', authRequired, async (_req, res) => {
  const orcs = await prisma.orcamento.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(orcs);
});

app.get('/api/orcamentos/:id', authRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const orc = await prisma.orcamento.findUnique({ where: { id } });
  if (!orc) return res.status(404).json({ error: 'Não encontrado' });
  return res.json(orc);
});

app.delete('/api/orcamentos/:id', authRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  try { await prisma.orcamento.delete({ where: { id } }); return res.json({ message: 'Removido' }); } catch { return res.status(404).json({ error: 'Não encontrado' }); }
});

// === FILAMENTOS ===
app.get('/api/filamentos', authRequired, async (_req, res) => {
  const f = await prisma.filamento.findMany({ orderBy: { nome: 'asc' } });
  return res.json(f);
});

app.post('/api/filamentos', authRequired, async (req, res) => {
  const result = filamentoCreateSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const f = await prisma.filamento.create({ data: result.data });
  return res.status(201).json(f);
});

app.put('/api/filamentos/:id', authRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  const result = filamentoCreateSchema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  try { const f = await prisma.filamento.update({ where: { id }, data: result.data }); return res.json(f); } catch { return res.status(404).json({ error: 'Não encontrado' }); }
});

app.post('/api/filamentos/:id/consumir', authRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  const schema = z.object({ pesoGramas: z.number().positive() });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const f = await prisma.filamento.findUnique({ where: { id } });
  if (!f) return res.status(404).json({ error: 'Não encontrado' });
  const novoEstoque = Math.max(f.estoqueKg - result.data.pesoGramas / 1000, 0);
  const updated = await prisma.filamento.update({ where: { id }, data: { estoqueKg: novoEstoque } });
  return res.json({ ...updated, alertaEstoqueBaixo: updated.estoqueKg <= updated.estoqueMinKg });
});

app.post('/api/filamentos/:id/abastecer', authRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  const schema = z.object({ pesoGramas: z.number().positive() });
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const f = await prisma.filamento.findUnique({ where: { id } });
  if (!f) return res.status(404).json({ error: 'Não encontrado' });
  const updated = await prisma.filamento.update({ where: { id }, data: { estoqueKg: f.estoqueKg + result.data.pesoGramas / 1000 } });
  return res.json(updated);
});

app.delete('/api/filamentos/:id', authRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  try { await prisma.filamento.delete({ where: { id } }); return res.json({ message: 'Removido' }); } catch { return res.status(404).json({ error: 'Não encontrado' }); }
});

// === IMPRESSORAS ===
app.get('/api/impressoras', authRequired, async (_req, res) => {
  const imps = await prisma.impressora.findMany({ orderBy: { nome: 'asc' } });
  return res.json(imps);
});

app.post('/api/impressoras', authRequired, async (req, res) => {
  const result = impressoraCreateSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  const imp = await prisma.impressora.create({ data: result.data });
  return res.status(201).json(imp);
});

app.put('/api/impressoras/:id', authRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  const result = impressoraCreateSchema.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  try { const imp = await prisma.impressora.update({ where: { id }, data: result.data }); return res.json(imp); } catch { return res.status(404).json({ error: 'Não encontrada' }); }
});

app.delete('/api/impressoras/:id', authRequired, async (req, res) => {
  const id = parseInt(req.params.id);
  try { await prisma.impressora.delete({ where: { id } }); return res.json({ message: 'Removida' }); } catch { return res.status(404).json({ error: 'Não encontrada' }); }
});

// === PROJECAO ===
app.post('/api/projecao', authRequired, (req, res) => {
  const result = projecaoInputSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  return res.json(calcularProjecaoMensal(result.data));
});

export default app;
