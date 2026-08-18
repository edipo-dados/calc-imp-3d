import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed admin user
  const adminEmail = 'admin@calculadora3d.com';
  const existingAdmin = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const senhaHash = await bcrypt.hash('admin123', 10);
    await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: adminEmail,
        senha: senhaHash,
        role: 'admin',
      },
    });
    console.log('Admin criado: admin@calculadora3d.com / admin123');
  } else {
    console.log('Admin já existe');
  }

  // Seed filamentos
  const filamentos = [
    { nome: 'PLA Padrão', tipo: 'PLA', cor: 'Branco', precoPorKg: 100, densidade: 1.24, estoqueKg: 2.0, estoqueMinKg: 0.3 },
    { nome: 'PETG Padrão', tipo: 'PETG', cor: 'Transparente', precoPorKg: 130, densidade: 1.27, estoqueKg: 1.5, estoqueMinKg: 0.3 },
    { nome: 'ABS Padrão', tipo: 'ABS', cor: 'Preto', precoPorKg: 120, densidade: 1.04, estoqueKg: 1.0, estoqueMinKg: 0.2 },
    { nome: 'TPU Flexível', tipo: 'TPU', cor: 'Preto', precoPorKg: 180, densidade: 1.21, estoqueKg: 0.5, estoqueMinKg: 0.2 },
    { nome: 'Resina Standard', tipo: 'Resina', cor: 'Cinza', precoPorKg: 250, densidade: 1.10, estoqueKg: 0.8, estoqueMinKg: 0.2 },
  ];

  for (const f of filamentos) {
    const existing = await prisma.filamento.findFirst({ where: { nome: f.nome } });
    if (!existing) {
      await prisma.filamento.create({ data: f });
    }
  }
  console.log('Seed concluído: filamentos padrão inseridos');
}

main().catch(console.error).finally(() => prisma.$disconnect());
