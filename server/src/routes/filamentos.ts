import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { filamentoCreateSchema, filamentoUpdateSchema, filamentoEstoqueSchema } from '../schemas/calculoInput.schema';

const router = Router();
const prisma = new PrismaClient();

// GET /api/filamentos
router.get('/', async (_req: Request, res: Response) => {
  const filamentos = await prisma.filamento.findMany({ orderBy: { nome: 'asc' } });
  return res.json(filamentos);
});

// POST /api/filamentos
router.post('/', async (req: Request, res: Response) => {
  const result = filamentoCreateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const filamento = await prisma.filamento.create({
    data: {
      nome: result.data.nome,
      tipo: result.data.tipo || 'PLA',
      cor: result.data.cor || 'Padrão',
      precoPorKg: result.data.precoPorKg,
      densidade: result.data.densidade,
      estoqueKg: result.data.estoqueKg || 0,
      estoqueMinKg: result.data.estoqueMinKg || 0.2,
    },
  });
  return res.status(201).json(filamento);
});

// PUT /api/filamentos/:id
router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const result = filamentoUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  try {
    const filamento = await prisma.filamento.update({ where: { id }, data: result.data });
    return res.json(filamento);
  } catch {
    return res.status(404).json({ error: 'Filamento não encontrado' });
  }
});

// POST /api/filamentos/:id/consumir — Deduct from inventory when a piece is produced
router.post('/:id/consumir', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const result = filamentoEstoqueSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const filamento = await prisma.filamento.findUnique({ where: { id } });
  if (!filamento) return res.status(404).json({ error: 'Filamento não encontrado' });

  const gramas = result.data.pesoGramas;
  const kgConsumido = gramas / 1000;
  const novoEstoque = filamento.estoqueKg - kgConsumido;

  const updated = await prisma.filamento.update({
    where: { id },
    data: { estoqueKg: Math.max(novoEstoque, 0) },
  });

  const alertaEstoqueBaixo = updated.estoqueKg <= updated.estoqueMinKg;
  return res.json({ ...updated, alertaEstoqueBaixo });
});

// POST /api/filamentos/:id/abastecer — Add stock
router.post('/:id/abastecer', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const result = filamentoEstoqueSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const filamento = await prisma.filamento.findUnique({ where: { id } });
  if (!filamento) return res.status(404).json({ error: 'Filamento não encontrado' });

  const kgAdicionado = result.data.pesoGramas / 1000;
  const updated = await prisma.filamento.update({
    where: { id },
    data: { estoqueKg: filamento.estoqueKg + kgAdicionado },
  });
  return res.json(updated);
});

// DELETE /api/filamentos/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await prisma.filamento.delete({ where: { id } });
    return res.json({ message: 'Filamento removido' });
  } catch {
    return res.status(404).json({ error: 'Filamento não encontrado' });
  }
});

export default router;
