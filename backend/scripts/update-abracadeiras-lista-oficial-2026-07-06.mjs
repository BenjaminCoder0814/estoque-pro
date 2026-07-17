import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const itens = [
  // Coloridas
  { name: "Abraçadeira Nylon 2,5x100 Amarela", stock: 7000, size: "2,5x100", material: "Nylon", color: "Amarela", model: "Nylon" },
  { name: "Abraçadeira Nylon 2,5x100 Azul", stock: 2500, size: "2,5x100", material: "Nylon", color: "Azul", model: "Nylon" },
  { name: "Abraçadeira Nylon 2,5x100 Vermelha", stock: 2000, size: "2,5x100", material: "Nylon", color: "Vermelha", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x150 Lilás", stock: 9800, size: "3,6x150", material: "Nylon", color: "Lilás", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x150 Vermelha", stock: 25400, size: "3,6x150", material: "Nylon", color: "Vermelha", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x120 Natural", stock: 1600, size: "4,8x120", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x200 Laranja", stock: 200, size: "4,8x200", material: "Nylon", color: "Laranja", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x200 Verde", stock: 200, size: "4,8x200", material: "Nylon", color: "Verde", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x200 Amarela", stock: 100, size: "4,8x200", material: "Nylon", color: "Amarela", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x200 Vermelha", stock: 12100, size: "4,8x200", material: "Nylon", color: "Vermelha", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x200 Azul", stock: 1100, size: "4,8x200", material: "Nylon", color: "Azul", model: "Nylon" },

  // Natural e preta (mantendo aprox)
  { name: "Abraçadeira Nylon 2,5x100 Preta aprox", stock: 3000, size: "2,5x100", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 2,5x100 Natural aprox", stock: 76000, size: "2,5x100", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 2,5x150 Natural aprox", stock: 60000, size: "2,5x150", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 2,5x150 Preta aprox", stock: 80000, size: "2,5x150", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 2,5x200 Natural aprox", stock: 70000, size: "2,5x200", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x150 Natural aprox", stock: 350000, size: "3,6x150", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x150 Preta aprox", stock: 100000, size: "3,6x150", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x200 Natural aprox", stock: 5000, size: "3,6x200", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x200 Preta aprox", stock: 90000, size: "3,6x200", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x250 Natural", stock: 2100, size: "3,6x250", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x250 Preta aprox", stock: 100000, size: "3,6x250", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x380 Preta aprox", stock: 4000, size: "3,6x380", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x380 Natural aprox", stock: 3000, size: "3,6x380", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x300 Preta aprox", stock: 150000, size: "3,6x300", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x300 Natural aprox", stock: 3000, size: "3,6x300", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 3,6x350 Preta aprox", stock: 75000, size: "3,6x350", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x200 Natural aprox", stock: 530000, size: "4,8x200", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x200 Preta aprox", stock: 140000, size: "4,8x200", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x250 Preta", stock: 1100, size: "4,8x250", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x250 Natural aprox", stock: 6000, size: "4,8x250", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x300 Natural aprox", stock: 720000, size: "4,8x300", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x300 Preta aprox", stock: 720000, size: "4,8x300", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x350 Natural aprox", stock: 3000, size: "4,8x350", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x350 Preta aprox", stock: 5000, size: "4,8x350", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x400 Preta aprox", stock: 115000, size: "4,8x400", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x400 Natural aprox", stock: 35000, size: "4,8x400", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x450 Natural aprox", stock: 60000, size: "4,8x450", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x450 Preta aprox", stock: 4000, size: "4,8x450", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x500 Natural", stock: 1700, size: "4,8x500", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 4,8x500 Preta aprox", stock: 12000, size: "4,8x500", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,2x200 Preta aprox", stock: 9000, size: "7,2x200", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,2x200 Natural aprox", stock: 12000, size: "7,2x200", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,2x300 Preta aprox", stock: 14000, size: "7,2x300", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,2x300 Natural aprox", stock: 5000, size: "7,2x300", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,6x230 Natural aprox", stock: 6000, size: "7,6x230", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,6x400 Preta aprox", stock: 18000, size: "7,6x400", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,6x400 Natural aprox", stock: 11000, size: "7,6x400", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,6x500 Natural aprox", stock: 5500, size: "7,6x500", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,6x500 Preta aprox", stock: 15500, size: "7,6x500", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,6x550 Natural", stock: 1200, size: "7,6x550", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 7,6x550 Preta aprox", stock: 2300, size: "7,6x550", material: "Nylon", color: "Preta", model: "Nylon" },
  { name: "Abraçadeira Nylon 9x400 Natural aprox", stock: 2000, size: "9x400", material: "Nylon", color: "Natural", model: "Nylon" },
  { name: "Abraçadeira Nylon 8x200 Natural aprox", stock: 6000, size: "8x200", material: "Nylon", color: "Natural", model: "Nylon" },

  // Inox
  { name: "Abraçadeira Inox 10x300", stock: 4000, size: "10x300", material: "Metálica", color: "Inox", model: "Inox" },
  { name: "Abraçadeira Inox 4,6x400", stock: 3400, size: "4,6x400", material: "Metálica", color: "Inox", model: "Inox" },
  { name: "Abraçadeira Inox 4,6x200", stock: 1400, size: "4,6x200", material: "Metálica", color: "Inox", model: "Inox" },
  { name: "Abraçadeira Inox 4,6x250", stock: 2500, size: "4,6x250", material: "Metálica", color: "Inox", model: "Inox" },
];

async function main() {
  let changed = 0;
  let unchanged = 0;
  const missing = [];

  for (const i of itens) {
    const row = await prisma.product.findFirst({ where: { name: i.name } });
    if (!row) {
      missing.push(i.name);
      console.log(`✗ NÃO ENCONTRADO: ${i.name}`);
      continue;
    }

    const data = {
      stockCurrent: i.stock,
      category: "Abraçadeiras",
      model: i.model,
      size: i.size,
      material: i.material,
      color: i.color,
      active: true,
    };

    const same =
      Number(row.stockCurrent || 0) === i.stock &&
      (row.category || "") === data.category &&
      (row.model || "") === data.model &&
      (row.size || "") === data.size &&
      (row.material || "") === data.material &&
      (row.color || "") === data.color &&
      row.active === true;

    if (same) {
      unchanged += 1;
      continue;
    }

    await prisma.product.update({ where: { id: row.id }, data });
    changed += 1;
    console.log(`✓ [${row.id}] ${row.name}`);
  }

  console.log("\n--- RESUMO ---");
  console.log(`Total lista: ${itens.length}`);
  console.log(`Atualizados: ${changed}`);
  console.log(`Sem alteração: ${unchanged}`);
  console.log(`Não encontrados: ${missing.length}`);
  if (missing.length) {
    for (const n of missing) console.log(`- ${n}`);
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
