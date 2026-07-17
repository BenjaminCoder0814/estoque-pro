import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const names = [
    "Abraçadeira Nylon 3,6x300 Natural aprox",
    "Abraçadeira Nylon 2,5x200 Natural aprox",
    "Abraçadeira Nylon 4,8x200 Natural aprox",
    "Abraçadeira Nylon 4,8x200 Preta aprox",
  ];

  const rows = await prisma.product.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true, stockCurrent: true },
    orderBy: [{ name: "asc" }],
  });

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
