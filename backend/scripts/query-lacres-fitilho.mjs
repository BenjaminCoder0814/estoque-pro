import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const rows = await p.product.findMany({
  where: {
    OR: [
      { category: "Lacres" },
      { name: { contains: "Lacre Sacola" } },
      { name: { contains: "Fitilho" } },
      { name: { contains: "fitilho" } },
    ],
  },
  select: { id: true, name: true, category: true, model: true, material: true, color: true, stockCurrent: true },
  orderBy: { id: "asc" },
});

for (const r of rows) {
  console.log(`[${r.id}] ${r.name} | cat=${r.category} mat=${r.material} cor=${r.color} | atual=${r.stockCurrent}`);
}
console.log(`\nTotal: ${rows.length}`);
await p.$disconnect();
