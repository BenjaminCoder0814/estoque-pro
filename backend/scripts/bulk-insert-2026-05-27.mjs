// Bulk insert 2026-05-27 — fitas, cadeados, amarrilhos, lacres especiais, ferramentas
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const items = [
  // Etiquetas / outros
  { name: 'Etiqueta de Segurança (rolos)', category: 'Etiquetas',    stock: 19,  minimum: 5  },
  { name: 'Fitilho Branco (menor)',         category: 'Acessórios',   stock: 25,  minimum: 5  },
  { name: 'Aplicador de Sacola',            category: 'Ferramentas',  stock: 100, minimum: 10 },
  { name: 'Alicate Corte Diagonal 6"',      category: 'Ferramentas',  stock: 2,   minimum: 1  },
  { name: 'Máquina Lacradora Azul',         category: 'Máquinas',     stock: 7,   minimum: 1  },

  // Fitas
  { name: 'Fita Zebrada',                                  category: 'Fitas', stock: 6,   minimum: 2  },
  { name: 'Fita de Demarcação',                            category: 'Fitas', stock: 1,   minimum: 1  },
  { name: 'Fita Cuidado Frágil / Violação',                category: 'Fitas', stock: 2,   minimum: 1  },
  { name: 'Rolo Fita Uso de ECF',                          category: 'Fitas', stock: 13,  minimum: 3  },
  { name: 'Fita Isolante 5mm',                             category: 'Fitas', stock: 59,  minimum: 10 },
  { name: 'Fita Isolante 10mm',                            category: 'Fitas', stock: 126, minimum: 10 },
  { name: 'Fita Isolante 20mm',                            category: 'Fitas', stock: 50,  minimum: 10 },

  // Cadeados
  { name: 'Cadeado Gold 25mm',                             category: 'Cadeados', stock: 9,   minimum: 2 },
  { name: 'Cadeado Gold 60mm',                             category: 'Cadeados', stock: 42,  minimum: 2 }, // 1 + 42 unificado — VERIFICAR
  { name: 'Cadeado General 50mm',                          category: 'Cadeados', stock: 3,   minimum: 1 },
  { name: 'Cadeado Pado 30mm',                             category: 'Cadeados', stock: 10,  minimum: 2 },
  { name: 'Cadeado Pado 45mm',                             category: 'Cadeados', stock: 1,   minimum: 1 },
  { name: 'Cadeado Pado Haste Longa 30mm',                 category: 'Cadeados', stock: 12,  minimum: 2 },
  { name: 'Cadeado RAH 25mm',                              category: 'Cadeados', stock: 9,   minimum: 2 },
  { name: 'Cadeado Papaiz 25mm',                           category: 'Cadeados', stock: 5,   minimum: 2 },
  { name: 'Cadeado Papaiz 30mm',                           category: 'Cadeados', stock: 1,   minimum: 1 },
  { name: 'Cadeado Papaiz 40mm',                           category: 'Cadeados', stock: 1,   minimum: 1 },
  { name: 'Cadeado Gold Art 20mm',                         category: 'Cadeados', stock: 90,  minimum: 10 },
  { name: 'Cadeado Gold Art 25mm',                         category: 'Cadeados', stock: 73,  minimum: 10 },
  { name: 'Cadeado Gold Art 50mm',                         category: 'Cadeados', stock: 1,   minimum: 1 },
  { name: 'Cadeado Gold News 25mm',                        category: 'Cadeados', stock: 1,   minimum: 1 },
  { name: 'Cadeado Gold News 30mm',                        category: 'Cadeados', stock: 7,   minimum: 2 },
  { name: 'Cadeado Gold News 60mm',                        category: 'Cadeados', stock: 2,   minimum: 1 },
  { name: 'Cadeado Aram Haste Longa 35mm',                 category: 'Cadeados', stock: 17,  minimum: 3 },
  { name: 'Cadeado Gromo (novo) 20mm',                     category: 'Cadeados', stock: 50,  minimum: 5 },
  { name: 'Cadeado Gromo (novo) 25mm',                     category: 'Cadeados', stock: 50,  minimum: 5 },
  { name: 'Cadeado Tritam (novo) 27mm',                    category: 'Cadeados', stock: 634, minimum: 50 },
  { name: 'Cadeado Tritam (novo) 50mm',                    category: 'Cadeados', stock: 60,  minimum: 10 },

  // Amarrilhos (estoque em kg)
  { name: 'Amarrilho 8cm Branco (kg)',                     category: 'Amarrilhos', stock: 100, minimum: 20 },
  { name: 'Amarrilho 10cm Branco (kg)',                    category: 'Amarrilhos', stock: 16,  minimum: 5  },
  { name: 'Amarrilho 14cm Preto (kg)',                     category: 'Amarrilhos', stock: 1,   minimum: 1  },
  { name: 'Amarrilho 15cm Branco (kg)',                    category: 'Amarrilhos', stock: 4,   minimum: 2  },
  { name: 'Amarrilho 18cm Branco (kg)',                    category: 'Amarrilhos', stock: 25,  minimum: 5  },
  { name: 'Amarrilho 20cm Branco (kg)',                    category: 'Amarrilhos', stock: 30,  minimum: 5  },
  { name: 'Amarrilho 30cm Branco (kg)',                    category: 'Amarrilhos', stock: 17,  minimum: 5  },

  // Lacres especiais (total de unidades)
  { name: 'Lacre Anel Pino 125mm (18 cx × 5.000)',         category: 'Lacres', stock: 90000, minimum: 5000 },
  { name: 'Lacre Tag Pin 40mm (10 cx × 5.000)',            category: 'Lacres', stock: 50000, minimum: 5000 },
  { name: 'Lacre Tag Amarelo Preto e Branco',              category: 'Lacres', stock: 0,     minimum: 1    }, // SEM QTD INFORMADA
];

const created = [];
const updated = [];

for (const it of items) {
  const dup = await prisma.product.findFirst({ where: { name: it.name } });
  if (dup) {
    const u = await prisma.product.update({
      where: { id: dup.id },
      data: { stockCurrent: it.stock, stockMinimum: it.minimum, category: it.category, active: true },
    });
    updated.push(`#${u.id}  ${u.name}  =  ${u.stockCurrent}`);
    continue;
  }
  const c = await prisma.product.create({
    data: {
      name: it.name,
      code: '',
      category: it.category,
      model: '',
      size: '',
      material: '',
      color: '',
      stockCurrent: it.stock,
      stockMinimum: it.minimum,
      controlsStock: true,
      alertEnabled: true,
      active: true,
      image: '',
    },
  });
  created.push(`#${c.id}  [${c.category}]  ${c.name}  =  ${c.stockCurrent}`);
}

console.log('\n=== CRIADOS (' + created.length + ') ===');
created.forEach(s => console.log('  ' + s));
if (updated.length) {
  console.log('\n=== ATUALIZADOS (' + updated.length + ') ===');
  updated.forEach(s => console.log('  ' + s));
}
console.log(`\nTotal: criados=${created.length}  atualizados=${updated.length}`);

await prisma.$disconnect();
