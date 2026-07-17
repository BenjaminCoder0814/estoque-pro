import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const r = await p.product.findMany({
  where: { category: 'Liso' },
  select: { id: true, name: true, category: true, model: true, material: true, size: true, color: true },
  orderBy: { id: 'asc' },
  take: 10,
});
console.log('AMOSTRA LISO:', r);
const cats = await p.product.groupBy({ by: ['category'], _count: { _all: true } });
console.log('TOTAIS:', cats);
await p.$disconnect();
