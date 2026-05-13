// Seed do estoque conforme inventário "MATERIAIS NUMERADOS ESTOQUE 04/26"
// Estratégia: para cada item, find por (category, name) exato (case-insensitive)
// e atualizar stockCurrent; criar caso não exista. Mantém movimentações antigas.

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const ITEMS = [
  // ===== ZNAN =====
  { category: 'ZNAN', name: 'ZNAN Azul',                              stock: 300   },
  { category: 'ZNAN', name: 'ZNAN Verde',                             stock: 2100  },
  { category: 'ZNAN', name: 'ZNAN Amarelo',                           stock: 1700  },
  { category: 'ZNAN', name: 'ZNAN Vermelho',                          stock: 100   },
  // sub-bullets (sem qtd) — registramos com 0 e marcam observação
  { category: 'ZNAN', name: 'ZNAN Azul (Rentank)',                    stock: 0     },
  { category: 'ZNAN', name: 'ZNAN Policarbonato',                     stock: 0, note: 'estoque escasso' },
  { category: 'ZNAN', name: 'ZNAN Cerradinho Verde e Azul',           stock: 0     },

  // ===== DT =====
  { category: 'DT', name: 'DT 16 PP Amarelo',                         stock: 1900  },
  { category: 'DT', name: 'DT 16 PP Cinza',                           stock: 500   },
  { category: 'DT', name: 'DT 16 PP Azul',                            stock: 4800  },
  { category: 'DT', name: 'DT 16 PP Branco',                          stock: 1900  },
  { category: 'DT', name: 'DT 16 PP Verde',                           stock: 1800  },
  { category: 'DT', name: 'DT 16 PP Vermelho (pata maior)',           stock: 30700 },
  { category: 'DT', name: 'DT 16 PP Verde (pata maior)',              stock: 9700  },
  { category: 'DT', name: 'DT 16 PP Laranja (pata maior)',            stock: 14200 },
  { category: 'DT', name: 'DT 16 PP Preto (pata maior)',              stock: 13700 },
  { category: 'DT', name: 'DT 16 PP Branco (código de barras)',       stock: 5300  },

  { category: 'DT', name: 'DT 23 PP Verde',                           stock: 1900  },
  { category: 'DT', name: 'DT 23 PP Vermelho',                        stock: 9000  },

  { category: 'DT', name: 'DT 31 PP Azul',                            stock: 3000  },
  { category: 'DT', name: 'DT 31 PP Amarelo',                         stock: 1000  },

  { category: 'DT', name: 'DT 41 PP Azul',                            stock: 300   },
  { category: 'DT', name: 'DT 41 PP Laranja',                         stock: 1900  },
  { category: 'DT', name: 'DT 41 PP Verde',                           stock: 900   },

  // ===== ES =====
  { category: 'ES', name: 'ES 16 NY Branco',                          stock: 1900  },
  { category: 'ES', name: 'ES 16 NY Amarelo',                         stock: 6700  },
  { category: 'ES', name: 'ES 16 NY Laranja',                         stock: 1000  },
  { category: 'ES', name: 'ES 16 NY Azul',                            stock: 1200  },
  { category: 'ES', name: 'ES 16 PP Vermelho',                        stock: 4300  },
  { category: 'ES', name: 'ES 16 PP Azul',                            stock: 2600  },
  { category: 'ES', name: 'ES 16 Corte Fácil Azul',                   stock: 200   },
  { category: 'ES', name: 'ES 16 Corte Fácil Amarelo',                stock: 2500  },

  { category: 'ES', name: 'ES 23 NY Azul',                            stock: 10300 },
  { category: 'ES', name: 'ES 23 NY Laranja',                         stock: 3500  },
  { category: 'ES', name: 'ES 23 NY Branco',                          stock: 1500  },
  { category: 'ES', name: 'ES 23 NY Preto',                           stock: 1800  },
  { category: 'ES', name: 'ES 23 NY Verde',                           stock: 1500  },
  { category: 'ES', name: 'ES 23 NY Vermelho',                        stock: 1500  },
  { category: 'ES', name: 'ES 23 PP Verde',                           stock: 2700  },
  { category: 'ES', name: 'ES 23 PP Vermelho',                        stock: 2200  },
  { category: 'ES', name: 'ES 23 PP Amarelo',                         stock: 500   },
  { category: 'ES', name: 'ES 23 PP Azul',                            stock: 900   },
  { category: 'ES', name: 'ES 23 Corte Fácil Amarelo',                stock: 900   },
  { category: 'ES', name: 'ES 23 PP (código de barras)',              stock: 4800  },

  { category: 'ES', name: 'ES 28 PP Azul',                            stock: 500   },
  { category: 'ES', name: 'ES 28 PP Amarelo',                         stock: 300   },

  // ===== EP =====
  { category: 'EP', name: 'EP 16 PE Azul',                            stock: 2000  },
  { category: 'EP', name: 'EP 23 PE Azul',                            stock: 2700  },
];

// Heurística para preencher os campos derivados (model/size/material/color)
function derive(item) {
  const n = item.name.toLowerCase();
  const model = item.category;
  // size: número entre 10-99 após sigla
  const sizeMatch = n.match(/\b(\d{2})\b/);
  const size = sizeMatch ? sizeMatch[1] : '';
  // material: pp | ny | pe | policarbonato
  let material = '';
  if (/\bpolicarbonato\b/.test(n)) material = 'POLICARBONATO';
  else if (/\bpp\b/.test(n)) material = 'PP';
  else if (/\bny\b/.test(n)) material = 'NY';
  else if (/\bpe\b/.test(n)) material = 'PE';
  // color: nome após o material (primeira palavra de cor reconhecida)
  const colors = ['Azul', 'Verde', 'Amarelo', 'Vermelho', 'Branco', 'Cinza', 'Laranja', 'Preto'];
  let color = '';
  for (const c of colors) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(item.name)) { color = c; break; }
  }
  return { model, size, material, color };
}

async function run() {
  let created = 0, updated = 0;
  for (const it of ITEMS) {
    const { model, size, material, color } = derive(it);
    const existing = await prisma.product.findFirst({
      where: {
        category: it.category,
        name: { equals: it.name },
      },
    });
    const note = it.note || '';
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          stockCurrent: it.stock,
          model, size, material, color,
          active: true,
          controlsStock: true,
          alertEnabled: true,
          code: existing.code || note,
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          name: it.name,
          category: it.category,
          model, size, material, color,
          code: note,
          stockCurrent: it.stock,
          stockMinimum: 50,
          controlsStock: true,
          alertEnabled: true,
          active: true,
          image: '',
        },
      });
      created++;
    }
  }
  console.log(`OK — criados: ${created}, atualizados: ${updated}, total no payload: ${ITEMS.length}`);
  const totals = await prisma.product.groupBy({
    by: ['category'],
    where: { category: { in: ['ZNAN', 'DT', 'ES', 'EP'] } },
    _sum: { stockCurrent: true },
    _count: { _all: true },
  });
  console.log('Totais por categoria:');
  totals.forEach(t => console.log(`  ${t.category}: ${t._count._all} itens, soma estoque = ${t._sum.stockCurrent}`));
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
