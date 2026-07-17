// Script de atualização de estoque — atualizações do WhatsApp 03/06 e 05/06/2026
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const updates = [
  // ── ES 23 NY Coloridos (msg 03/06 09:59) ──
  { id: 37,  name: "Lacres ES NY 23 Laranja",           stockCurrent: 2500 },
  { id: 36,  name: "Lacres ES NY 23 Azul",              stockCurrent: 9300 },
  { id: 38,  name: "Lacres ES NY 23 Branco",            stockCurrent: 500  },
  { id: 39,  name: "Lacres ES NY 23 Preto",             stockCurrent: 800  },
  { id: 40,  name: "Lacres ES NY 23 Verde",             stockCurrent: 500  },
  { id: 41,  name: "Lacres ES NY 23 Vermelho",          stockCurrent: 500  },

  // ── Máquina Lacradora Azul (msg 03/06 10:00 — "máquinas lacradora azul 2 uni") ──
  { id: 124, name: "Máquina Lacradora Azul",            stockCurrent: 2    },

  // ── Rolo de Arame 2.26mm (msg 03/06 10:09 — "2.26 27 kilos") ──
  { id: 111, name: "Rolo Arame 2.26mm — 30 kg",        stockCurrent: 27   },

  // ── Cadeados novos — Gromo e Tritam (msg 05/06 10:25) ──
  { id: 150, name: "Cadeado Gromo (novo) 25mm",         stockCurrent: 514  },
  { id: 149, name: "Cadeado Gromo (novo) 20mm",         stockCurrent: 600  },
  { id: 152, name: "Cadeado Tritam (novo) 50mm",        stockCurrent: 60   }, // sem alteração, confirmando
  { id: 151, name: "Cadeado Tritam (novo) 27mm",        stockCurrent: 540  },

  // ── Arame 30cm (msg 05/06 14:35 — última correção: 23.000) ──
  { id: 58,  name: "Arame 30cm (CORTADO)",              stockCurrent: 23000 },
];

async function run() {
  let ok = 0, fail = 0;
  for (const u of updates) {
    try {
      const before = await p.product.findUnique({ where: { id: u.id }, select: { stockCurrent: true, name: true } });
      await p.product.update({ where: { id: u.id }, data: { stockCurrent: u.stockCurrent } });
      console.log(`✓ [${u.id}] ${before?.name ?? u.name}: ${before?.stockCurrent} → ${u.stockCurrent}`);
      ok++;
    } catch (e) {
      console.error(`✗ [${u.id}] ${u.name}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nResultado: ${ok} atualizados, ${fail} erros`);
  await p.$disconnect();
}

run();
