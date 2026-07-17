require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const total = await prisma.product.count();
  const comEstoque = await prisma.product.count({ where: { stock: { gt: 0 } } });
  const semEstoque = await prisma.product.count({ where: { stock: 0 } });
  const semNull = await prisma.product.count({ where: { stock: null } });
  console.log('Total produtos:', total);
  console.log('Com estoque > 0:', comEstoque);
  console.log('Estoque = 0:', semEstoque);
  console.log('Estoque null:', semNull);

  const porCat = await prisma.product.groupBy({ by: ['category'], _count: true, _sum: { stock: true } });
  console.log('\nPor categoria:');
  for (const c of porCat) {
    console.log(' ', (c.category || '(sem categoria)').padEnd(25), '| qtd:', String(c._count).padStart(3), '| estoque total:', c._sum.stock ?? 'null');
  }

  // Produtos sem estoque definido ou zerado
  const problemas = await prisma.product.findMany({
    where: { OR: [{ stock: 0 }, { stock: null }] },
    select: { id: true, name: true, category: true, stock: true },
    orderBy: { category: 'asc' }
  });
  if (problemas.length > 0) {
    console.log('\nProdutos sem estoque (0 ou null):');
    for (const p of problemas) console.log(' ', p.category, '|', p.name, '| stock:', p.stock);
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
