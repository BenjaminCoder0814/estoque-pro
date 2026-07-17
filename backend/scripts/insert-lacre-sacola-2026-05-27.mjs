// Lacre Sacola — rígido vs flexível — 2026-05-27
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const items = [
  { color: 'Azul',     variant: 'Rígido',   stock: 120000 },
  { color: 'Vermelho', variant: 'Rígido',   stock: 370000 },
  { color: 'Amarelo',  variant: 'Rígido',   stock: 230000 },
  { color: 'Preto',    variant: 'Flexível', stock: 90000  },
  { color: 'Amarelo',  variant: 'Flexível', stock: 40000  },
  { color: 'Vermelho', variant: 'Flexível', stock: 40000  },
  { color: 'Branco',   variant: 'Flexível', stock: 10000  },
  { color: 'Laranja',  variant: 'Flexível', stock: 10000  },
];

const created = [];
const updated = [];

for (const it of items) {
  const name = `Lacre Sacola ${it.color} ${it.variant}`;
  const dup = await prisma.product.findFirst({ where: { name } });
  if (dup) {
    const u = await prisma.product.update({
      where: { id: dup.id },
      data: { stockCurrent: it.stock },
    });
    updated.push(`#${u.id}  ${u.name}  =  ${u.stockCurrent}`);
    continue;
  }
  const c = await prisma.product.create({
    data: {
      name,
      code: '',
      category: 'Lacres',
      model: 'Lacre Sacola',
      size: '',
      material: it.variant === 'Rígido' ? 'Rígido' : 'Flexível',
      color: it.color,
      stockCurrent: it.stock,
      stockMinimum: 1000,
      controlsStock: true,
      alertEnabled: true,
      active: true,
      image: '',
    },
  });
  created.push(`#${c.id}  ${c.name}  =  ${c.stockCurrent}`);
}

console.log('\n=== CRIADOS (' + created.length + ') ===');
created.forEach(s => console.log('  ' + s));
if (updated.length) {
  console.log('\n=== ATUALIZADOS (' + updated.length + ') ===');
  updated.forEach(s => console.log('  ' + s));
}
console.log(`\nTotal: criados=${created.length}  atualizados=${updated.length}`);

await prisma.$disconnect();
