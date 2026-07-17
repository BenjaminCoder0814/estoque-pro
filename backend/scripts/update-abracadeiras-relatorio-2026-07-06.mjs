import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updates = [
  // Coloridas
  ["Abraçadeira Nylon 2,5x100 Amarela", 7000],
  ["Abraçadeira Nylon 2,5x100 Azul", 2500],
  ["Abraçadeira Nylon 2,5x100 Vermelha", 2000],
  ["Abraçadeira Nylon 3,6x150 Lilás", 9800],
  ["Abraçadeira Nylon 3,6x150 Vermelha", 25400],
  ["Abraçadeira Nylon 4,8x120 Natural", 1600],
  ["Abraçadeira Nylon 4,8x200 Laranja", 200],
  ["Abraçadeira Nylon 4,8x200 Verde", 200],
  ["Abraçadeira Nylon 4,8x200 Amarela", 100],
  ["Abraçadeira Nylon 4,8x200 Vermelha", 12100],
  ["Abraçadeira Nylon 4,8x200 Azul", 1100],

  // Natural e preta (mantendo nomes com "aprox")
  ["Abraçadeira Nylon 2,5x100 Preta aprox", 3000],
  ["Abraçadeira Nylon 2,5x100 Natural aprox", 76000],
  ["Abraçadeira Nylon 2,5x150 Natural aprox", 60000],
  ["Abraçadeira Nylon 2,5x150 Preta aprox", 80000],
  ["Abraçadeira Nylon 2,5x200 Natural aprox", 70000],
  ["Abraçadeira Nylon 3,6x150 Natural aprox", 350000],
  ["Abraçadeira Nylon 3,6x150 Preta aprox", 100000],
  ["Abraçadeira Nylon 3,6x200 Natural aprox", 5000],
  ["Abraçadeira Nylon 3,6x200 Preta aprox", 90000],
  ["Abraçadeira Nylon 3,6x250 Natural", 2100],
  ["Abraçadeira Nylon 3,6x250 Preta aprox", 100000],
  ["Abraçadeira Nylon 3,6x380 Preta aprox", 4000],
  ["Abraçadeira Nylon 3,6x380 Natural aprox", 3000],
  ["Abraçadeira Nylon 3,6x300 Preta aprox", 150000],
  ["Abraçadeira Nylon 3,6x300 Natural aprox", 3000],
  ["Abraçadeira Nylon 3,6x350 Preta aprox", 75000],
  ["Abraçadeira Nylon 4,8x200 Natural aprox", 530000],
  ["Abraçadeira Nylon 4,8x200 Preta aprox", 140000],
  ["Abraçadeira Nylon 4,8x250 Preta", 1100],
  ["Abraçadeira Nylon 4,8x250 Natural aprox", 6000],
  ["Abraçadeira Nylon 4,8x300 Natural aprox", 720000],
  ["Abraçadeira Nylon 4,8x300 Preta aprox", 720000],
  ["Abraçadeira Nylon 4,8x350 Natural aprox", 3000],
  ["Abraçadeira Nylon 4,8x350 Preta aprox", 5000],
  ["Abraçadeira Nylon 4,8x400 Preta aprox", 115000],
  ["Abraçadeira Nylon 4,8x400 Natural aprox", 35000],
  ["Abraçadeira Nylon 4,8x450 Natural aprox", 60000],
  ["Abraçadeira Nylon 4,8x450 Preta aprox", 4000],
  ["Abraçadeira Nylon 4,8x500 Natural", 1700],
  ["Abraçadeira Nylon 4,8x500 Preta aprox", 12000],
  ["Abraçadeira Nylon 7,2x200 Preta aprox", 9000],
  ["Abraçadeira Nylon 7,2x200 Natural aprox", 12000],
  ["Abraçadeira Nylon 7,2x300 Preta aprox", 14000],
  ["Abraçadeira Nylon 7,2x300 Natural aprox", 5000],
  ["Abraçadeira Nylon 7,6x230 Natural aprox", 6000],
  ["Abraçadeira Nylon 7,6x400 Preta aprox", 18000],
  ["Abraçadeira Nylon 7,6x400 Natural aprox", 11000],
  ["Abraçadeira Nylon 7,6x500 Natural aprox", 5500],
  ["Abraçadeira Nylon 7,6x500 Preta aprox", 15500],
  ["Abraçadeira Nylon 7,6x550 Natural", 1200],
  ["Abraçadeira Nylon 7,6x550 Preta aprox", 2300],
  ["Abraçadeira Nylon 9x400 Natural aprox", 2000],
  ["Abraçadeira Nylon 8x200 Natural aprox", 6000],

  // Inox
  ["Abraçadeira Inox 10x300", 4000],
  ["Abraçadeira Inox 4,6x400", 3400],
  ["Abraçadeira Inox 4,6x200", 1400],
  ["Abraçadeira Inox 4,6x250", 2500],
];

async function main() {
  const missing = [];
  let changed = 0;
  let unchanged = 0;

  for (const [name, stockCurrent] of updates) {
    const item = await prisma.product.findFirst({
      where: { name },
      select: { id: true, name: true, stockCurrent: true },
    });

    if (!item) {
      missing.push(name);
      console.log(`✗ NÃO ENCONTRADO: ${name}`);
      continue;
    }

    if (item.stockCurrent === stockCurrent) {
      unchanged += 1;
      console.log(`= [${item.id}] ${item.name}: ${item.stockCurrent}`);
      continue;
    }

    await prisma.product.update({
      where: { id: item.id },
      data: { stockCurrent },
    });

    changed += 1;
    console.log(`✓ [${item.id}] ${item.name}: ${item.stockCurrent} -> ${stockCurrent}`);
  }

  console.log("\n--- RESUMO ---");
  console.log(`Total no relatorio: ${updates.length}`);
  console.log(`Atualizados: ${changed}`);
  console.log(`Sem alteracao: ${unchanged}`);
  console.log(`Nao encontrados: ${missing.length}`);
  if (missing.length > 0) {
    console.log("Lista nao encontrados:");
    for (const name of missing) console.log(`- ${name}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
