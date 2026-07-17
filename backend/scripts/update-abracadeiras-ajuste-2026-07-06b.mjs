import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const updates = [
  ["Abraçadeira Nylon 3,6x300 Natural aprox", 0],
  ["Abraçadeira Nylon 2,5x200 Natural aprox", 95000],
  ["Abraçadeira Nylon 4,8x200 Natural aprox", 520000],
  ["Abraçadeira Nylon 4,8x200 Preta aprox", 138000],
];

async function main() {
  for (const [name, stockCurrent] of updates) {
    const item = await prisma.product.findFirst({
      where: { name },
      select: { id: true, name: true, stockCurrent: true },
    });

    if (!item) {
      console.log(`✗ NÃO ENCONTRADO: ${name}`);
      continue;
    }

    await prisma.product.update({
      where: { id: item.id },
      data: { stockCurrent },
    });

    console.log(`✓ [${item.id}] ${item.name}: ${item.stockCurrent} -> ${stockCurrent}`);
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
