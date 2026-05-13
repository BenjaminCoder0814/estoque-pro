// Atualização pontual de estoque informada pela equipe
// Formato: "antes - depois" -> setamos depois e registramos uma movimentação de SAÍDA com a diferença.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const UPDATES = [
  { match: { category: 'ZNAN', name: 'ZNAN Verde' },                 from: 2100, to: 1900 },
  { match: { category: 'ES',   name: 'ES 16 NY Amarelo' },           from: 1700, to: 1000 },
  { match: { category: 'DT',   name: 'DT 23 PP Verde' },             from: 1900, to: 1200 },
  { match: { category: 'ES',   name: 'ES 16 Corte Fácil Amarelo' },  from: 2100, to: 1800 },
];

async function run() {
  for (const u of UPDATES) {
    const prod = await prisma.product.findFirst({ where: u.match });
    if (!prod) {
      console.log(`⚠️  Não encontrado: ${u.match.category} / ${u.match.name}`);
      continue;
    }
    const before = prod.stockCurrent;
    const diff = u.to - before;
    await prisma.product.update({
      where: { id: prod.id },
      data: { stockCurrent: u.to },
    });
    if (diff !== 0) {
      await prisma.movement.create({
        data: {
          productId: prod.id,
          type: diff > 0 ? 'ENTRADA' : 'SAIDA',
          quantity: Math.abs(diff),
          note: `Atualização equipe — ${before} → ${u.to}`,
        },
      });
    }
    console.log(`✔ ${prod.category} / ${prod.name}: ${before} → ${u.to} (Δ ${diff > 0 ? '+' : ''}${diff})`);
  }
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
