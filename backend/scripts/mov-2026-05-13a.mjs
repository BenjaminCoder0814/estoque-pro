import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const MOVEMENTS = [
  { category: 'ES', name: 'ES 16 PP Azul', delta: -500, note: 'Saída informada pela equipe' },
];

async function run() {
  for (const m of MOVEMENTS) {
    const prod = await prisma.product.findFirst({ where: { category: m.category, name: m.name } });
    if (!prod) { console.log(`⚠️ não encontrado: ${m.category} / ${m.name}`); continue; }
    const before = prod.stockCurrent;
    const after = before + m.delta;
    await prisma.product.update({ where: { id: prod.id }, data: { stockCurrent: after } });
    await prisma.movement.create({
      data: {
        productId: prod.id,
        type: m.delta < 0 ? 'SAIDA' : 'ENTRADA',
        quantity: Math.abs(m.delta),
        note: m.note,
      },
    });
    console.log(`✔ ${prod.category} / ${prod.name}: ${before} → ${after} (${m.delta > 0 ? '+' : ''}${m.delta})`);
  }
}
run().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
