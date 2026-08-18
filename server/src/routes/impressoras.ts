import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { impressoraCreateSchema, impressoraUpdateSchema } from '../schemas/calculoInput.schema';

const router = Router();
const prisma = new PrismaClient();

// GET /api/impressoras
router.get('/', async (_req: Request, res: Response) => {
  const impressoras = await prisma.impressora.findMany({ orderBy: { nome: 'asc' } });
  return res.json(impressoras);
});

// POST /api/impressoras
router.post('/', async (req: Request, res: Response) => {
  const result = impressoraCreateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const impressora = await prisma.impressora.create({ data: result.data });
  return res.status(201).json(impressora);
});

// PUT /api/impressoras/:id
router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const result = impressoraUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  try {
    const impressora = await prisma.impressora.update({ where: { id }, data: result.data });
    return res.json(impressora);
  } catch {
    return res.status(404).json({ error: 'Impressora não encontrada' });
  }
});

// DELETE /api/impressoras/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await prisma.impressora.delete({ where: { id } });
    return res.json({ message: 'Impressora removida' });
  } catch {
    return res.status(404).json({ error: 'Impressora não encontrada' });
  }
});

export default router;
