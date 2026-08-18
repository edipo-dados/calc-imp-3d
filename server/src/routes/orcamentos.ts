import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculoInputSchema, orcamentoCreateSchema } from '../schemas/calculoInput.schema';
import { calcularPreco } from '../services/calculoService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/orcamentos/calcular — calculate without saving
router.post('/calcular', (req: Request, res: Response) => {
  const result = calculoInputSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const calculo = calcularPreco(result.data);
  return res.json(calculo);
});

// POST /api/orcamentos — save
router.post('/', async (req: Request, res: Response) => {
  const result = orcamentoCreateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const { nomePeca, ...inputs } = result.data;
  const calculo = calcularPreco(inputs);
  const orcamento = await prisma.orcamento.create({
    data: {
      nomePeca,
      inputs: inputs as object,
      breakdown: calculo.breakdown as object,
      precoMinimo: calculo.precoMinimo,
      precoIdeal: calculo.precoIdeal,
      precoPremium: calculo.precoPremium,
    },
  });
  return res.status(201).json(orcamento);
});

// GET /api/orcamentos — list
router.get('/', async (_req: Request, res: Response) => {
  const orcamentos = await prisma.orcamento.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(orcamentos);
});

// GET /api/orcamentos/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const orcamento = await prisma.orcamento.findUnique({ where: { id } });
  if (!orcamento) return res.status(404).json({ error: 'Orçamento não encontrado' });
  return res.json(orcamento);
});

// DELETE /api/orcamentos/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await prisma.orcamento.delete({ where: { id } });
    return res.json({ message: 'Orçamento removido' });
  } catch {
    return res.status(404).json({ error: 'Orçamento não encontrado' });
  }
});

export default router;
