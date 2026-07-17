import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "Abraçadeira" } },
        { name: { contains: "Abracadeira" } },
        { category: { contains: "Abraçadeira" } },
        { category: { contains: "Abracadeira" } },
        { name: { contains: "Inox" } },
      ],
    },
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
