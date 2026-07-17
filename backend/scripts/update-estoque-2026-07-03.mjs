// Atualização de estoque — pedido Maciel 03/07/2026 (WhatsApp)
//   rígido verde 10.000  → cria "Lacre Sacola Verde Rígido" (não existia)
//   preto flexível 350.000 → atualiza Lacre Sacola Preto Flexível
//   fitilho 252 uni      → atualiza Fitilho Branco (menor)
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function run() {
  // 1) Lacre Sacola Verde Rígido — criar (ou atualizar se já existir)
  const nomeVerde = "Lacre Sacola Verde Rígido";
  const dup = await p.product.findFirst({ where: { name: nomeVerde } });
  if (dup) {
    const before = dup.stockCurrent;
    const u = await p.product.update({ where: { id: dup.id }, data: { stockCurrent: 10000 } });
    console.log(`~ [${u.id}] ${u.name}: ${before} → ${u.stockCurrent} (já existia, atualizado)`);
  } else {
    const c = await p.product.create({
      data: {
        name: nomeVerde,
        code: "",
        category: "Lacres",
        model: "Lacre Sacola",
        size: "",
        material: "Rígido",
        color: "Verde",
        stockCurrent: 10000,
        stockMinimum: 1000,
        controlsStock: true,
        alertEnabled: true,
        active: true,
        image: "",
      },
    });
    console.log(`+ [${c.id}] ${c.name}: CRIADO com ${c.stockCurrent}`);
  }

  // 2) e 3) atualizações por id
  const updates = [
    { id: 166, name: "Lacre Sacola Preto Flexível", stockCurrent: 350000 },
    { id: 121, name: "Fitilho Branco (menor)",      stockCurrent: 252    },
  ];
  for (const u of updates) {
    const before = await p.product.findUnique({ where: { id: u.id }, select: { stockCurrent: true, name: true } });
    if (!before) { console.error(`✗ [${u.id}] ${u.name}: NÃO ENCONTRADO`); continue; }
    await p.product.update({ where: { id: u.id }, data: { stockCurrent: u.stockCurrent } });
    console.log(`✓ [${u.id}] ${before.name}: ${before.stockCurrent} → ${u.stockCurrent}`);
  }

  await p.$disconnect();
}

run();
