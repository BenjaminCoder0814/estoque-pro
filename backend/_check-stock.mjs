import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const updates = [
  { id: 4, name: 'ZNAN Azul S/R',      stockCurrent: 300 },
  { id: 7, name: 'ZNAN Vermelho S/R',  stockCurrent: 100 },
];

for (const u of updates) {
  const before = await prisma.product.findUnique({ where: { id: u.id }, select: { stockCurrent: true } });
  await prisma.product.update({ where: { id: u.id }, data: { stockCurrent: u.stockCurrent } });
  console.log(`✓ ${u.name.padEnd(35)} | antes: ${String(before.stockCurrent).padStart(7)} → agora: ${u.stockCurrent}`);
}

await prisma.$disconnect();
console.log('\nConcluído.');
