import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { perfilCustosCreateSchema, perfilCustosUpdateSchema } from '../schemas/calculoInput.schema';

const router = Router();
const prisma = new PrismaClient();

// GET /api/perfis
router.get('/', async (_req: Request, res: Response) => {
  const perfis = await prisma.perfilCustos.findMany({ orderBy: { nome: 'asc' } });
  return res.json(perfis);
});

// GET /api/perfis/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const perfil = await prisma.perfilCustos.findUnique({ where: { id } });
  if (!perfil) return res.status(404).json({ error: 'Perfil não encontrado' });
  return res.json(perfil);
});

// POST /api/perfis
router.post('/', async (req: Request, res: Response) => {
  const result = perfilCustosCreateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const perfil = await prisma.perfilCustos.create({ data: result.data });
  return res.status(201).json(perfil);
});

// PUT /api/perfis/:id
router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  const result = perfilCustosUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  try {
    const perfil = await prisma.perfilCustos.update({ where: { id }, data: result.data });
    return res.json(perfil);
  } catch {
    return res.status(404).json({ error: 'Perfil não encontrado' });
  }
});

// DELETE /api/perfis/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await prisma.perfilCustos.delete({ where: { id } });
    return res.json({ message: 'Perfil removido' });
  } catch {
    return res.status(404).json({ error: 'Perfil não encontrado' });
  }
});

export default router;
