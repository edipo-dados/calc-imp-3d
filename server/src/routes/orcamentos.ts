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

// POST /api/orcamentos — save (with optional stock deduction)
router.post('/', async (req: Request, res: Response) => {
  const result = orcamentoCreateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const { nomePeca, ...inputs } = result.data;
  const calculo = calcularPreco(inputs);
  
  // Optional: support extra fields passed alongside
  const filamentoId = req.body.filamentoId as number | undefined;
  const pesoSuporteGramas = req.body.pesoSuporteGramas as number | undefined;
  const custosExtras = req.body.custosExtras as { nome: string; valor: number }[] | undefined;
  
  // Calculate total extras
  let totalExtras = 0;
  if (custosExtras && Array.isArray(custosExtras)) {
    totalExtras = custosExtras.reduce((sum, e) => sum + (e.valor || 0), 0);
  }
  
  const orcamento = await prisma.orcamento.create({
    data: {
      nomePeca,
      inputs: { ...inputs, pesoSuporteGramas, custosExtras, filamentoId } as object,
      breakdown: { ...calculo.breakdown, totalExtras } as object,
      precoMinimo: calculo.precoMinimo + totalExtras,
      precoIdeal: calculo.precoIdeal + totalExtras,
      precoPremium: calculo.precoPremium + totalExtras,
    },
  });
  
  // Deduct from filament stock
  let alertaEstoqueBaixo = false;
  if (filamentoId) {
    const pesoTotal = inputs.pesoGramas + (pesoSuporteGramas || 0);
    const kgConsumido = (pesoTotal * (1 + inputs.desperdicioPercentual / 100)) / 1000;
    const filamento = await prisma.filamento.findUnique({ where: { id: filamentoId } });
    if (filamento) {
      const novoEstoque = Math.max(filamento.estoqueKg - kgConsumido, 0);
      const updated = await prisma.filamento.update({
        where: { id: filamentoId },
        data: { estoqueKg: novoEstoque },
      });
      alertaEstoqueBaixo = updated.estoqueKg <= updated.estoqueMinKg;
    }
  }
  
  return res.status(201).json({ ...orcamento, alertaEstoqueBaixo });
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
