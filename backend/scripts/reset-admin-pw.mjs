import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);
  const u = await prisma.user.update({
    where: { email: 'admin@zenith.local' },
    data: { passwordHash, active: true },
  });
  console.log('OK admin@zenith.local senha = admin123  (id', u.id, 'role', u.role, ')');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
