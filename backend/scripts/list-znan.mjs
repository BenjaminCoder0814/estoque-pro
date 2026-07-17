import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const items = await prisma.product.findMany({
  where: { OR: [
    { category: 'ZNAN' },
    { name: { contains: 'znan', mode: 'insensitive' } },
    { name: { contains: 'Znan', mode: 'insensitive' } },
  ]},
  orderBy: { id: 'asc' },
  select: { id: true, name: true, category: true, model: true, size: true, material: true, color: true, stockCurrent: true, stockMinimum: true },
});
console.log('ZNAN /  Znan products:');
console.table(items);
await prisma.$disconnect();
