import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const all = await p.product.groupBy({
  by: ['category'],
  _count: { _all: true },
});
console.log('CATEGORIAS:', all);
const metal = await p.product.findMany({
  where: { OR: [
    { name: { contains: 'metál', mode: 'insensitive' } },
    { material: { contains: 'metál', mode: 'insensitive' } },
    { category: { contains: 'metál', mode: 'insensitive' } },
  ]},
  select: { id:true, name:true, category:true, model:true, size:true, material:true, color:true, stockCurrent:true },
});
console.log('METAIS:', JSON.stringify(metal, null, 2));
await p.$disconnect();
