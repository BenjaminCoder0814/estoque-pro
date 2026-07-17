import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const rows = await p.product.findMany({
  where: {
    OR: [
      { color: { contains: "Verde" } },
      { name: { contains: "Verde" } },
      { name: { contains: "verde" } },
      { material: { contains: "Rígido" } },
    ],
  },
  select: { id: true, name: true, category: true, material: true, color: true, stockCurrent: true },
  orderBy: { id: "asc" },
});

for (const r of rows) {
  console.log(`[${r.id}] ${r.name} | cat=${r.category} mat=${r.material} cor=${r.color} | atual=${r.stockCurrent}`);
}
console.log(`\nTotal: ${rows.length}`);
await p.$disconnect();
