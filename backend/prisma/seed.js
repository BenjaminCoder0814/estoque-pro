import bcrypt from 'bcryptjs';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function upsertUser({ email, name, role, password, restrictBusiness = false }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, restrictBusiness, active: true },
    create: { email, name, passwordHash, role, restrictBusiness, active: true, displayName: '', displayNameSet: false },
  });
}

async function upsertUserResetPassword({ email, name, role, password, restrictBusiness = false }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, restrictBusiness, active: true },
    create: { email, name, passwordHash, role, restrictBusiness, active: true, displayName: '', displayNameSet: false },
  });
}

async function main() {
  // ---------- Núcleo ----------
  await upsertUser({ email: 'admin@zenith.local',  name: 'Administrador', role: 'ADMIN', password: 'admin123' });
  await upsertUser({ email: 'ti@zenith.local',     name: 'TI',            role: 'TI',    password: 'ti2026' });
  await upsertUser({ email: 'ti@zenith.com',       name: 'TI',            role: 'TI',    password: 'ti2026' });

  // ---------- Diretoria (espelho de ADMIN+TI) ----------
  await upsertUserResetPassword({ email: 'diretoria@zenith.com', name: 'Diretoria', role: 'DIRETORIA', password: 'diretoria123' });

  // ---------- Operacional ----------
  await upsertUser({ email: 'expedicao@zenith.local', name: 'Expedição', role: 'EXPEDICAO', password: '123456' });
  await upsertUser({ email: 'compras@zenith.local',   name: 'Compras',   role: 'COMPRAS',   password: '123456' });
  await upsertUser({ email: 'producao@zenith.local',  name: 'Produção',  role: 'PRODUCAO',  password: '123456' });
  await upsertUser({ email: 'visitante@zenith.local', name: 'Visitante', role: 'VISITANTE', password: '123456' });

  // ---------- Central de Atendimento (substitui Supervisão) ----------
  // Suporta as duas variantes de email — sempre RESETANDO a senha para a
  // padrão atual, para que o login funcione mesmo após o rename do supervisão.
  const old = await prisma.user.findUnique({ where: { email: 'supervisao@zenith.local' } }).catch(() => null);
  if (old) {
    await prisma.user.update({
      where: { id: old.id },
      data: {
        email: 'centralatendimento@zenith.com',
        name: 'Central de Atendimento',
        role: 'CENTRAL_ATENDIMENTO',
        restrictBusiness: true,
        passwordHash: await bcrypt.hash('atendimento2026', 10),
        active: true,
      },
    });
  }
  await upsertUserResetPassword({
    email: 'centralatendimento@zenith.com',
    name: 'Central de Atendimento',
    role: 'CENTRAL_ATENDIMENTO',
    password: 'atendimento2026',
    restrictBusiness: true,
  });
  await upsertUserResetPassword({
    email: 'centralatendimento@zenith.local',
    name: 'Central de Atendimento',
    role: 'CENTRAL_ATENDIMENTO',
    password: 'atendimento2026',
    restrictBusiness: true,
  });

  // ---------- Comercial REMOVIDO ----------
  await prisma.user.deleteMany({
    where: { OR: [{ email: 'comercial@zenith.local' }, { email: 'comercial@zenith.com' }] },
  });

  // ---------- Vendas (6 logins com perfil COMERCIAL) ----------
  const vendasEmails = [
    'vendas1@zenith.com',
    'vendas3@zenith.com',
    'vendas4@zenith.com',
    'vendas5@zenith.com',
    'vendas10@zenith.com',
    'vendas12@zenith.com',
  ];
  for (const email of vendasEmails) {
    const prefix = email.split('@')[0];     // ex: vendas3
    const password = `${prefix}2026`;       // ex: vendas32026
    const nome = `Vendas ${prefix.replace('vendas', '')}`;
    await upsertUserResetPassword({
      email,
      name: nome,
      role: 'COMERCIAL',
      password,
      restrictBusiness: true,
    });
  }

  // ---------- Produtos (não alterar se já houver) ----------
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
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
