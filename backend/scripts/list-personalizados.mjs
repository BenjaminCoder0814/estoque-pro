import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const items = await prisma.product.findMany({
  where: { OR: [
    { category: { contains: 'PERSONALIZ', mode: 'insensitive' } },
    { category: { contains: 'NUMERAD', mode: 'insensitive' } },
    { name: { contains: 'personaliz', mode: 'insensitive' } },
  ]},
  orderBy: { name: 'asc' },
  select: { id: true, name: true, category: true, stockCurrent: true },
});
console.log(`TOTAL: ${items.length}`);
items.forEach(i => console.log(`  #${i.id}  [${i.category}]  ${i.name}  =  ${i.stockCurrent}`));
await prisma.$disconnect();
