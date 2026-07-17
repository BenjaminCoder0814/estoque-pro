import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const r = await p.product.findMany({
  where: {
    OR: [
      { category: { contains: 'Lacre', mode: 'insensitive' } },
      { name: { contains: 'Lacre', mode: 'insensitive' } },
      { name: { startsWith: 'DT', mode: 'insensitive' } },
      { name: { startsWith: 'ES', mode: 'insensitive' } },
      { name: { startsWith: 'EP', mode: 'insensitive' } },
      { category: { equals: 'PERSONALIZADOS' } },
    ],
  },
  select: { id: true, name: true, code: true, category: true, model: true, size: true, material: true, color: true, stockCurrent: true },
  orderBy: [{ category: 'asc' }, { name: 'asc' }],
});
console.log(JSON.stringify(r, null, 2));
console.log('TOTAL:', r.length);
const cats = {};
for (const x of r) cats[x.category] = (cats[x.category]||0)+1;
console.log('Por categoria:', cats);
await p.$disconnect();
