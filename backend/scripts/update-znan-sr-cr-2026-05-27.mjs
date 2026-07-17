// Atualização ZNAN — 2026-05-27 — separa variantes S/R (sem rabicho) e C/R (com rabicho)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// updates: rename existing row + set stock
const renames = [
  { oldName: 'ZNAN Amarelo',  newName: 'ZNAN Amarelo S/R',  stock: 120000 },
  { oldName: 'ZNAN Verde',    newName: 'ZNAN Verde S/R',    stock: 118000 },
  { oldName: 'ZNAN Azul',     newName: 'ZNAN Azul S/R',     stock: 150000 },
  { oldName: 'ZNAN Vermelho', newName: 'ZNAN Vermelho S/R', stock: 245000 },
];

// creates: new product rows
const creates = [
  { name: 'ZNAN Amarelo C/R',  color: 'Amarelo',  stock: 80800 },
  { name: 'ZNAN Verde C/R',    color: 'Verde',    stock: 36000 },
  { name: 'ZNAN Azul C/R',     color: 'Azul',     stock: 5000  },
  { name: 'ZNAN Vermelho C/R', color: 'Vermelho', stock: 15000 },
  { name: 'ZNAN Marrom C/R',   color: 'Marrom',   stock: 3000  },
  { name: 'ZNAN Preto S/R',    color: 'Preto',    stock: 10000 },
  { name: 'ZNAN Laranja S/R',  color: 'Laranja',  stock: 26000 },
];

const summary = { renamed: [], created: [], skipped: [] };

for (const r of renames) {
  const existing = await prisma.product.findFirst({ where: { name: r.oldName } });
  if (!existing) {
    summary.skipped.push(`NAO ACHEI: ${r.oldName}`);
    continue;
  }
  const updated = await prisma.product.update({
    where: { id: existing.id },
    data: { name: r.newName, stockCurrent: r.stock },
  });
  summary.renamed.push(`#${updated.id}  ${r.oldName}  ->  ${r.newName}  =  ${r.stock}`);
}

for (const c of creates) {
  const dup = await prisma.product.findFirst({ where: { name: c.name } });
  if (dup) {
    const updated = await prisma.product.update({
      where: { id: dup.id },
      data: { stockCurrent: c.stock },
    });
    summary.renamed.push(`#${updated.id}  ja existia: ${c.name}  estoque atualizado para ${c.stock}`);
    continue;
  }
  const created = await prisma.product.create({
    data: {
      name: c.name,
      code: '',
      category: 'ZNAN',
      model: 'ZNAN',
      size: '',
      material: '',
      color: c.color,
      stockCurrent: c.stock,
      stockMinimum: 50,
      controlsStock: true,
      alertEnabled: true,
      active: true,
      image: '',
    },
  });
  summary.created.push(`#${created.id}  ${c.name}  =  ${c.stock}`);
}

console.log('\n=== RENOMEADOS ===');
summary.renamed.forEach((s) => console.log('  ' + s));
console.log('\n=== CRIADOS ===');
summary.created.forEach((s) => console.log('  ' + s));
if (summary.skipped.length) {
  console.log('\n=== ATENCAO ===');
  summary.skipped.forEach((s) => console.log('  ' + s));
}
console.log(`\nTotal: renomeados=${summary.renamed.length}  criados=${summary.created.length}  ignorados=${summary.skipped.length}`);

await prisma.$disconnect();
