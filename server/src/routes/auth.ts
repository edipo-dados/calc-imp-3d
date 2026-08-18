import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken, adminRequired, authRequired, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

// POST /api/auth/registrar — Register new user (status: pendente)
router.post('/registrar', async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const { nome, email, senha } = result.data;

  // Check if email already exists
  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senha: senhaHash, role: 'pendente' },
  });

  return res.status(201).json({
    message: 'Cadastro realizado com sucesso. Aguarde aprovação do administrador.',
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
  });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const { email, senha } = result.data;
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) {
    return res.status(401).json({ error: 'Email ou senha incorretos' });
  }

  if (usuario.role === 'pendente') {
    return res.status(403).json({ error: 'Cadastro pendente de aprovação pelo administrador' });
  }

  const token = generateToken({ id: usuario.id, email: usuario.email, role: usuario.role });
  return res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
  });
});

// GET /api/auth/me — Get current user info
router.get('/me', authRequired, async (req: AuthRequest, res: Response) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.user!.id } });
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role });
});

// GET /api/auth/pendentes — List pending users (admin only)
router.get('/pendentes', adminRequired, async (_req: Request, res: Response) => {
  const pendentes = await prisma.usuario.findMany({
    where: { role: 'pendente' },
    select: { id: true, nome: true, email: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(pendentes);
});

// POST /api/auth/aprovar/:id — Approve user (admin only)
router.post('/aprovar/:id', adminRequired, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { role: 'usuario' },
    });
    return res.json({ message: `Usuário ${usuario.nome} aprovado`, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role } });
  } catch {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
});

// POST /api/auth/rejeitar/:id — Reject/delete user (admin only)
router.post('/rejeitar/:id', adminRequired, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    await prisma.usuario.delete({ where: { id } });
    return res.json({ message: 'Cadastro rejeitado e removido' });
  } catch {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
});

// GET /api/auth/usuarios — List all users (admin only)
router.get('/usuarios', adminRequired, async (_req: Request, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(usuarios);
});

export default router;
