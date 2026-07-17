// Seed: Fita Metálica Cortada, Arame Cortado, Personalizados (clientes),
// e Rolos de Arame (vendidos por KG). Idempotente — upsert por (category, name).
// Categorias novas criadas para deixar bem claro na UI:
//   - FITA METÁLICA CORTADA    (todas as medidas JÁ CORTADAS, vendidas por unidade)
//   - ARAME CORTADO            (todas as medidas JÁ CORTADAS, vendidas por unidade)
//   - PERSONALIZADOS           (reservados — só vendem para o cliente específico)
//   - ARAME ROLO (KG)          (rolo inteiro — venda por quilo)

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ────────────────────────────────────────────────────────────────────
// 1) FITA METÁLICA CORTADA  (todos os tamanhos já cortados)
// ────────────────────────────────────────────────────────────────────
const FITA_METALICA_CORTADA = [
  { size: '40cm', stock: 15000 },
  { size: '30cm', stock: 16000 },
  { size: '25cm', stock: 22000 },
  { size: '20cm', stock: 23000 },
  { size: '15cm', stock:  9000 },
].map(it => ({
  category: 'FITA METÁLICA CORTADA',
  name: `Fita Metálica ${it.size} (CORTADA)`,
  model: 'CORTADA',
  size: it.size,
  material: 'METÁLICA',
  color: '',
  code: 'CORTADA',
  stockCurrent: it.stock,
  stockMinimum: 500,
  note: 'Medida JÁ CORTADA — vendida por unidade',
}));

// ────────────────────────────────────────────────────────────────────
// 2) ARAME CORTADO  (todos os tamanhos já cortados)
// ────────────────────────────────────────────────────────────────────
const ARAME_CORTADO = [
  { size: '35cm', material: '',     stock: 24000 },
  { size: '30cm', material: '',     stock: 32000 },
  { size: '20cm', material: 'INOX', stock:  5000, label: '(INOX)'   },
  { size: '20cm', material: '',     stock:  7000 },
  { size: '20cm', material: 'RUIM', stock:  1000, label: '(RUIM)'   },
  { size: '15cm', material: '',     stock:  8000 },
  { size: '60cm', material: '',     stock:  3000 },
  { size: '50cm', material: '',     stock: 11000 },
].map(it => ({
  category: 'ARAME CORTADO',
  name: `Arame ${it.size} ${it.label || ''}(CORTADO)`.replace(/\s+/g, ' ').trim(),
  model: 'CORTADO',
  size: it.size,
  material: it.material,
  color: '',
  code: it.material ? `CORTADO-${it.material}` : 'CORTADO',
  stockCurrent: it.stock,
  stockMinimum: 200,
  note: 'Medida JÁ CORTADA — vendida por unidade',
}));

// ────────────────────────────────────────────────────────────────────
// 3) PERSONALIZADOS — só vendem para o cliente do nome
//    Quantidade: usa o valor passado pelo cliente quando informado;
//    senão fica 0 e marca "Quantidade a confirmar com equipe".
// ────────────────────────────────────────────────────────────────────
// Cada entrada: { modelo, tamanho, material?, cor, cliente, obs?, qtd? }
const PERSONALIZADOS_RAW = [
  { modelo: 'ES', tamanho: '23', cor: 'Azul',     cliente: 'Iron' },
  { modelo: 'CF', tamanho: '16', cor: 'Vermelho', cliente: 'Sicred' },
  { modelo: 'CF', tamanho: '16', cor: 'Vermelho', cliente: 'Sicred', obs: 'liso' },
  { modelo: 'DT', tamanho: '31', material: 'PP', cor: 'Laranja',  cliente: 'Metrofile' },
  { modelo: 'DT', tamanho: '41', cor: 'Verde',     cliente: 'Ar Frio' },
  { modelo: 'ES', tamanho: '23', cor: 'Amarelo',   cliente: 'South', obs: 'já embalado' },
  { modelo: 'ES', tamanho: '23', cor: 'Preto',     cliente: 'Americanas' },
  { modelo: 'ES', tamanho: '23', cor: 'Vermelho',  cliente: 'Americanas' },
  { modelo: 'ES', tamanho: '23', cor: 'Cinza',     cliente: 'Americanas' },
  { modelo: 'ES', tamanho: '23', cor: 'Amarelo',   cliente: 'Mig Plus' },
  { modelo: 'ES', tamanho: '23', material: 'NY', cor: 'Azul',     cliente: 'Simpatia' },
  { modelo: 'ES', tamanho: '16', cor: 'Vermelho', cliente: 'Simpatia' },
  { modelo: 'ES', tamanho: '23', cor: 'Vermelho', cliente: 'Lê Bicuit' },
  { modelo: 'ES', tamanho: '16', cor: 'Azul',     cliente: 'Vicunha' },
  { modelo: 'ES', tamanho: '23', cor: 'Branco',   cliente: 'Laboratil' },
  { modelo: 'ES', tamanho: '23', cor: 'Azul',     cliente: 'Laboratil' },
  { modelo: 'ES', tamanho: '16', cor: 'Azul',     cliente: 'Iron' },
  { modelo: 'DT', tamanho: '55', cor: 'Verde',    cliente: 'Agrocp' },
  { modelo: 'DT', tamanho: '31', cor: 'Vermelho', cliente: 'Primato' },
  { modelo: 'ES', tamanho: '16', cor: 'Azul',     cliente: 'Livraria' },
  { modelo: 'ES', tamanho: '23', cor: 'Azul',     cliente: 'Plascar' },
  { modelo: 'ES', tamanho: '23', cor: 'Vermelho', cliente: 'Marisa' },
  { modelo: 'ES', tamanho: '23', cor: 'Amarelo',  cliente: 'Plascar' },
  { modelo: 'ES', tamanho: '16', cor: 'Branco',   cliente: 'Inovar', qtd: 1000 },
  { modelo: 'DT', tamanho: '41', cor: 'Verde',    cliente: 'Jotabassa', qtd: 1000 },
  { modelo: 'DT', tamanho: '31', cor: 'Laranja',  cliente: 'Wickbold' },
  { modelo: 'DT', tamanho: '36', cor: 'Verde',    cliente: 'Granfus' },
  { modelo: 'DT', tamanho: '31', cor: 'Amarelo',  cliente: 'Imile' },
  { modelo: 'ES', tamanho: '23', cor: 'Azul',     cliente: 'MN' },
  { modelo: 'DT', tamanho: '31', cor: 'Azul',     cliente: 'Uniggel' },
  { modelo: 'DT', tamanho: '41', cor: 'Vermelho', cliente: 'P&G' },
  { modelo: 'ES', tamanho: '16', cor: 'Azul',     cliente: 'São Camilo' },
  { modelo: 'ES', tamanho: '16', cor: 'Laranja',  cliente: 'São Camilo' },
  { modelo: 'DT', tamanho: '31', cor: 'Rosa',     cliente: 'Coplana' },
  { modelo: 'DT', tamanho: '31', cor: 'Branco',   cliente: 'Coplana' },
  { modelo: 'DT', tamanho: '31', cor: 'Verde',    cliente: 'Ar Frio' },
  { modelo: 'DT', tamanho: '31', cor: 'Vermelho', cliente: 'Coplana' },
  { modelo: 'DT', tamanho: '31', cor: 'Roxo',     cliente: 'Coplana' },
  { modelo: 'DT', tamanho: '31', cor: 'Amarelo',  cliente: 'Coplana' },
  { modelo: 'DT', tamanho: '31', cor: 'Azul',     cliente: 'Coplana' },
  { modelo: 'DT', tamanho: '31', cor: 'Verde',    cliente: 'Coplana' },
  { modelo: 'ES CF', tamanho: '23', cor: 'Azul',  cliente: 'United' },
  { modelo: 'ES', tamanho: '16', cor: 'Amarelo',  cliente: 'Tokstok' },
  { modelo: 'ES', tamanho: '23', cor: 'Branco',   cliente: 'Mobi' },
  { modelo: 'DT', tamanho: '36', cor: 'Azul',     cliente: 'J&T' },
];

const PERSONALIZADOS = PERSONALIZADOS_RAW.map(p => {
  const pieces = [
    p.modelo,
    p.tamanho,
    p.material || '',
    p.cor,
    `— ${p.cliente.toUpperCase()}`,
    p.obs ? `(${p.obs})` : '',
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return {
    category: 'PERSONALIZADOS',
    name: pieces,
    model: p.modelo,
    size: p.tamanho,
    material: p.material || '',
    color: p.cor,
    code: `CLIENTE:${p.cliente.toUpperCase()}${p.obs ? ` | ${p.obs.toUpperCase()}` : ''}`,
    stockCurrent: p.qtd ?? 0,
    stockMinimum: 0,
    note: `RESERVADO PARA ${p.cliente.toUpperCase()} — só vender para este cliente.` +
          (p.qtd ? '' : ' Quantidade a confirmar com equipe.'),
  };
});

// ────────────────────────────────────────────────────────────────────
// 4) ROLOS DE ARAME (inteiros, vendidos por KG)
//    stockCurrent é em quilos.
// ────────────────────────────────────────────────────────────────────
const ARAME_ROLOS = [
  { codigo: '3.26', kg: 10 },
  { codigo: '2.26', kg: 30 },
  { codigo: '3.22', kg:  3 },
].map(r => ({
  category: 'ARAME ROLO (KG)',
  name: `Rolo Arame ${r.codigo}mm — ${r.kg} kg`,
  model: 'ROLO',
  size: `${r.codigo}mm`,
  material: 'ROLO INTEIRO',
  color: '',
  code: `ROLO-${r.codigo}-KG`,
  stockCurrent: r.kg,
  stockMinimum: 1,
  note: 'ROLO INTEIRO — vendido por QUILO (KG). Não é peça cortada.',
}));

// ────────────────────────────────────────────────────────────────────
const ALL_ITEMS = [
  ...FITA_METALICA_CORTADA,
  ...ARAME_CORTADO,
  ...PERSONALIZADOS,
  ...ARAME_ROLOS,
];

async function run() {
  let created = 0, updated = 0;
  for (const it of ALL_ITEMS) {
    const existing = await prisma.product.findFirst({
      where: { category: it.category, name: { equals: it.name } },
    });
    const data = {
      name: it.name,
      category: it.category,
      model: it.model,
      size: it.size,
      material: it.material,
      color: it.color,
      code: it.code,
      stockCurrent: it.stockCurrent,
      stockMinimum: it.stockMinimum,
      controlsStock: true,
      alertEnabled: true,
      active: true,
      image: '',
    };
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.product.create({ data });
      created++;
    }
  }

  console.log(`\n✔ Concluído — criados: ${created}, atualizados: ${updated}, total no payload: ${ALL_ITEMS.length}\n`);

  const totals = await prisma.product.groupBy({
    by: ['category'],
    where: { category: { in: [
      'FITA METÁLICA CORTADA',
      'ARAME CORTADO',
      'PERSONALIZADOS',
      'ARAME ROLO (KG)',
    ] } },
    _sum:   { stockCurrent: true },
    _count: { _all: true },
  });

  console.log('Totais por categoria:');
  totals.forEach(t => console.log(`  ${t.category.padEnd(28)} ${String(t._count._all).padStart(3)} itens | estoque total = ${t._sum.stockCurrent}`));
}

run()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
