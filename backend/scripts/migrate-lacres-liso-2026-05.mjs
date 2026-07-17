// Migração: aplica nova convenção de nomes/categorias para lacres plásticos e fita metálica.
// Categoria = "Liso" (padrão); Modelo = DT/ES/EP/METALICA; Nome = "Lacres <MODEL> <MAT>[ CF] <SIZE> <COLOR> [variante]".
// PERSONALIZADOS não são tocados (já têm cliente vinculado).
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function detectMaterial(p) {
  let mat = (p.material || '').toUpperCase().trim();
  const nameU = (p.name || '').toUpperCase();
  if (!mat) {
    if (nameU.includes('CORTE FÁCIL') || nameU.includes('CORTE FACIL') || /\bCF\b/.test(nameU)) mat = 'PP';
    else if (p.model === 'EP') mat = 'PE';
    else mat = 'PP';
  }
  return mat;
}

function detectCF(p) {
  const n = (p.name || '').toUpperCase();
  return n.includes('CORTE FÁCIL') || n.includes('CORTE FACIL') || /\bCF\b/.test(n);
}

function detectVariant(name) {
  const m = (name || '').match(/\((pata maior|c[óo]digo de barras|cod\.? barras|barcode)\)/i);
  if (!m) return '';
  const txt = m[1].toLowerCase();
  if (txt.includes('pata')) return '(pata maior)';
  return '(código de barras)';
}

function buildLacreName(p) {
  const model = p.model || p.category; // DT/ES/EP
  const mat = detectMaterial(p);
  const cf = detectCF(p);
  const variant = detectVariant(p.name);

  const parts = ['Lacres', model];
  if (model === 'EP') {
    // Template do usuário: "Lacres EP" (sem material)
  } else {
    parts.push(mat);
    if (cf) parts.push('CF');
  }
  if (p.size) parts.push(String(p.size));
  if (p.color) parts.push(p.color);
  let name = parts.join(' ');
  if (variant) name += ' ' + variant;
  return { name, model, material: mat };
}

const updates = [];

// 1) DT/ES/EP → category "Liso"
const lacres = await prisma.product.findMany({
  where: { category: { in: ['DT', 'ES', 'EP'] } },
});
for (const p of lacres) {
  const { name, model, material } = buildLacreName(p);
  updates.push({
    id: p.id,
    old: { name: p.name, category: p.category, model: p.model, material: p.material },
    new: { name, category: 'Liso', model, material },
  });
}

// 2) Fitas metálicas → category "Liso", nome mantém formato atual mas garante consistência
const fitas = await prisma.product.findMany({
  where: { category: 'FITA METÁLICA CORTADA' },
});
for (const p of fitas) {
  // Nome no formato: "Lacres Metálico <size>" (sem CORTADA na frente; mantém info no campo size)
  const sz = String(p.size || '').trim();
  const name = `Lacres Metálico ${sz}`.trim();
  updates.push({
    id: p.id,
    old: { name: p.name, category: p.category, model: p.model, material: p.material },
    new: { name, category: 'Liso', model: 'METÁLICO', material: 'METÁLICA' },
  });
}

// Aplica
let changed = 0;
for (const u of updates) {
  const diff =
    u.old.name !== u.new.name ||
    u.old.category !== u.new.category ||
    u.old.model !== u.new.model ||
    u.old.material !== u.new.material;
  if (!diff) continue;
  await prisma.product.update({
    where: { id: u.id },
    data: u.new,
  });
  changed++;
  console.log(`[#${u.id}]`);
  console.log(`  - ${u.old.category} | ${u.old.name}`);
  console.log(`  + ${u.new.category} | ${u.new.name}`);
}

console.log(`\n✔ Atualizados: ${changed} de ${updates.length} analisados.`);

const totais = await prisma.product.groupBy({
  by: ['category'],
  _count: { _all: true },
  orderBy: { category: 'asc' },
});
console.log('\nTotais por categoria:');
for (const t of totais) console.log(`  ${t.category.padEnd(28)} ${t._count._all}`);

await prisma.$disconnect();
