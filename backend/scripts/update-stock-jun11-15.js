// Script de atualização de estoque — mensagens do WhatsApp 11/06, 12/06 e 15/06/2026 (Tiago)
// Valores adotados: versão MAIS RECENTE quando houve correção dentro das mensagens.
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const updates = [
  // ── DT (msg 12/06 — "alteração" sobrescreve a snapshot e a msg de 11/06) ──
  { id: 23,  name: "Lacres DT PP 31 Azul",      stockCurrent: 200 },  // 11/06 dizia 1000 → 12/06 corrigiu p/ 200
  { id: 24,  name: "Lacres DT PP 31 Amarelo",   stockCurrent: 0   },  // zerado em 12/06
  { id: 109, name: "DT 36 Azul — J&T",          stockCurrent: 400 },  // 11/06 dizia 700 → 12/06 corrigiu p/ 400

  // ── Arame em rolo (msg 11/06 17:13 — "arame rolo 3x22 2 kg em estoque") ──
  { id: 112, name: "Rolo Arame 3.22mm — 3 kg",  stockCurrent: 2   },

  // ── ZNAN (snapshot 12/06 — mapeados aos registros S/R, alinhados com azul/vermelho que já batiam) ──
  { id: 5,   name: "ZNAN Verde S/R",            stockCurrent: 2100 },
  { id: 6,   name: "ZNAN Amarelo S/R",          stockCurrent: 1700 },
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
