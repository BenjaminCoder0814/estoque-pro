import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const names = [
    "Lacre Sacola Verde Rígido",
    "Lacre Sacola Preto Flexível",
    "Fitilho Branco (menor)",
  ];

  const rows = await prisma.product.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true, stockCurrent: true, category: true },
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
