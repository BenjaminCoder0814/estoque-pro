import bcrypt from 'bcryptjs';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function upsertUser({ email, name, role, password, restrictBusiness = false }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, restrictBusiness, active: true },
    create: { email, name, role, passwordHash, restrictBusiness, active: true },
  });
}

async function main() {
  await upsertUser({ email: 'admin@zenith.local', name: 'Administrador', role: 'ADMIN', password: 'admin123' });
  await upsertUser({ email: 'expedicao@zenith.local', name: 'Expedição', role: 'EXPEDICAO', password: '123456' });
  await upsertUser({ email: 'compras@zenith.local', name: 'Compras', role: 'COMPRAS', password: '123456' });
  await upsertUser({ email: 'supervisao@zenith.local', name: 'Supervisão', role: 'SUPERVISAO', password: '123456', restrictBusiness: true });
  await upsertUser({ email: 'comercial@zenith.local', name: 'Comercial', role: 'COMERCIAL', password: '123456' });
  await upsertUser({ email: 'producao@zenith.local', name: 'Produção', role: 'PRODUCAO', password: '123456' });
  await upsertUser({ email: 'visitante@zenith.local', name: 'Visitante', role: 'VISITANTE', password: '123456' });

  const count = await prisma.product.count();
  if (count === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Lacre de Segurança Padrão', category: 'Lacres', code: 'LAC-001', stockCurrent: 1200, stockMinimum: 300, controlsStock: true, alertEnabled: true },
        { name: 'Etiqueta Adesiva VOID', category: 'Etiquetas', code: 'ETQ-VOID', stockCurrent: 500, stockMinimum: 150, controlsStock: true, alertEnabled: true },
        { name: 'Malote Logístico', category: 'Malotes', code: 'MAL-100', stockCurrent: 90, stockMinimum: 30, controlsStock: true, alertEnabled: true },
      ],
    });
  }

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
