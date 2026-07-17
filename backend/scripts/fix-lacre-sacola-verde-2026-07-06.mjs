import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "Lacre Sacola" } },
        { name: { contains: "Fitilho" } },
      ],
    },
    select: {
      id: true,
      name: true,
      category: true,
      model: true,
      material: true,
      color: true,
      stockCurrent: true,
      active: true,
    },
    orderBy: [{ name: "asc" }],
  });

  console.log("--- ANTES ---");
  console.log(JSON.stringify(rows, null, 2));

  // 1) Garantir verde como RIGIDO e estoque 10.000
  const verdeFlex = await prisma.product.findFirst({
    where: { name: "Lacre Sacola Verde Flexível" },
    select: { id: true, name: true, stockCurrent: true },
  });

  if (verdeFlex) {
    await prisma.product.update({
      where: { id: verdeFlex.id },
      data: {
        name: "Lacre Sacola Verde Rígido",
        model: "Lacre Sacola",
        material: "Rígido",
        color: "Verde",
        stockCurrent: 10000,
        active: true,
      },
    });
    console.log(`✓ Verde corrigido [${verdeFlex.id}]: Flexível -> Rígido (10000)`);
  }

  // 2) Garantir preto flexivel 350.000
  const pretoFlex = await prisma.product.findFirst({
    where: { name: "Lacre Sacola Preto Flexível" },
    select: { id: true, stockCurrent: true },
  });
  if (pretoFlex) {
    await prisma.product.update({
      where: { id: pretoFlex.id },
      data: { stockCurrent: 350000 },
    });
    console.log(`✓ Preto Flexível [${pretoFlex.id}] = 350000`);
  }

  // 3) Garantir fitilho 252
  const fitilho = await prisma.product.findFirst({
    where: { name: "Fitilho Branco (menor)" },
    select: { id: true, stockCurrent: true },
  });
  if (fitilho) {
    await prisma.product.update({
      where: { id: fitilho.id },
      data: { stockCurrent: 252 },
    });
    console.log(`✓ Fitilho [${fitilho.id}] = 252`);
  }

  // Se houver duplicatas de "Lacre Sacola Verde Rígido", manter apenas a mais recente ativa
  const verdesRigidos = await prisma.product.findMany({
    where: { name: "Lacre Sacola Verde Rígido" },
    select: { id: true, active: true, updatedAt: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });

  if (verdesRigidos.length > 1) {
    const keepId = verdesRigidos[0].id;
    for (const v of verdesRigidos.slice(1)) {
      if (v.active) {
        await prisma.product.update({ where: { id: v.id }, data: { active: false } });
      }
    }
    console.log(`✓ Duplicatas de verde rígido desativadas. Mantido ativo: [${keepId}]`);
  }

  const after = await prisma.product.findMany({
    where: {
      OR: [
        { name: { in: ["Lacre Sacola Verde Rígido", "Lacre Sacola Verde Flexível", "Lacre Sacola Preto Flexível", "Fitilho Branco (menor)"] } },
      ],
    },
    select: {
      id: true,
      name: true,
      material: true,
      color: true,
      stockCurrent: true,
      active: true,
      updatedAt: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  console.log("--- DEPOIS (itens alvo) ---");
  console.log(JSON.stringify(after, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
