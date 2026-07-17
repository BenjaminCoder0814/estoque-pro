/*
 * import-novos-produtos.js
 * --------------------------------------------------------------------------
 * Importa os 102 produtos novos (gerados em mapeamento-produtos.json)
 * no banco do Sistema de Estoque Zenith (SIZ).
 *
 * Como rodar no Render Shell (ou local):
 *     cd backend
 *     node prisma/import-novos-produtos.js
 *
 * Idempotente: usa upsert por (name + category).
 * --------------------------------------------------------------------------
 */
import pkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Lê o JSON de mapeamento (deve estar copiado para backend/prisma/)
const jsonPath = path.join(__dirname, 'mapeamento-produtos.json');
if (!fs.existsSync(jsonPath)) {
  console.error('ERRO: arquivo nao encontrado:', jsonPath);
  console.error('Copie mapeamento-produtos.json para backend/prisma/ antes de rodar.');
  process.exit(1);
}
const items = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Mapeia categoria interna -> rotulo PT-BR usado no SIZ
const CAT_LABEL = {
  cadeados:    'Cadeados',
  fitas:       'Fitas Industriais',
  maquinas:    'Maquinas e Ferramentas',
  lancamentos: 'Novos Lancamentos 2026',
};

// URL publica base (Hostinger). Imagens ja foram subidas em /Imagens/<pasta>/<arquivo>.
const PUBLIC_BASE = process.env.SITE_PUBLIC_BASE || 'https://lacres.com.br';

async function main() {
  console.log('Importando', items.length, 'produtos...');
  let created = 0, updated = 0;

  for (const it of items) {
    const data = {
      name:         it.nome,
      code:         it.slug,
      category:     CAT_LABEL[it.categoria] || it.categoria,
      model:        '',
      size:         '',
      material:     '',
      color:        '',
      stockCurrent: 0,
      stockMinimum: 0,
      image:        PUBLIC_BASE + it.url_imagem.split('/').map(encodeURIComponent).join('/').replace(/^%2F/, '/'),
    };

    // Procura por code unico (slug). Como o schema nao tem unique em code,
    // fazemos lookup manual.
    const existing = await prisma.product.findFirst({ where: { name: data.name, category: data.category } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.product.create({ data });
      created++;
    }
  }

  console.log(`OK -> criados: ${created}, atualizados: ${updated}, total: ${items.length}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
