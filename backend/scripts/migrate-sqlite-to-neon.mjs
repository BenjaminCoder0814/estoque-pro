// Migra todos os dados do SQLite local (dev.db) para o Postgres do Neon.
// Como o Prisma Client atual já está apontando pro Neon (via .env), usamos
// better-sqlite3 para ler o SQLite cru sem precisar reconfigurar o Prisma.

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE_PATH = path.resolve(__dirname, '..', 'prisma', 'dev.db');

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const prisma = new PrismaClient();

function rows(sql) {
  try { return sqlite.prepare(sql).all(); }
  catch (e) { console.warn(`Tabela ausente (${sql}):`, e.message); return []; }
}

function asDate(v) {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);
  // SQLite armazena ISO string normalmente
  const d = new Date(v);
  return isNaN(d) ? new Date() : d;
}

function asBool(v) {
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1' || v === 'true') return true;
  if (v === 0 || v === '0' || v === 'false') return false;
  return Boolean(v);
}

async function main() {
  console.log('📦 Lendo dados do SQLite:', SQLITE_PATH);

  const users         = rows('SELECT * FROM User');
  const products      = rows('SELECT * FROM Product');
  const movements     = rows('SELECT * FROM Movement');
  const pending       = rows('SELECT * FROM PendingOrder');
  const media         = rows('SELECT * FROM MediaAsset');
  const audits        = rows('SELECT * FROM AuditLog');

  console.log(`Usuarios: ${users.length} · Produtos: ${products.length} · Movimentos: ${movements.length}`);
  console.log(`PendingOrder: ${pending.length} · MediaAsset: ${media.length} · AuditLog: ${audits.length}`);

  // Inserções preservando os IDs originais (createMany com skipDuplicates)
  if (users.length) {
    await prisma.user.createMany({
      data: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        passwordHash: u.passwordHash,
        role: u.role || 'VISITANTE',
        active: asBool(u.active),
        restrictBusiness: asBool(u.restrictBusiness),
        createdAt: asDate(u.createdAt),
        updatedAt: asDate(u.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  if (products.length) {
    await prisma.product.createMany({
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code || '',
        category: p.category,
        model: p.model || '',
        size: p.size || '',
        material: p.material || '',
        color: p.color || '',
        stockCurrent: p.stockCurrent || 0,
        stockMinimum: p.stockMinimum || 0,
        controlsStock: asBool(p.controlsStock),
        alertEnabled: asBool(p.alertEnabled),
        active: asBool(p.active),
        image: p.image || '',
        createdAt: asDate(p.createdAt),
        updatedAt: asDate(p.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  if (movements.length) {
    await prisma.movement.createMany({
      data: movements.map(m => ({
        id: m.id,
        productId: m.productId,
        userId: m.userId,
        type: m.type,
        quantity: m.quantity,
        note: m.note || '',
        createdAt: asDate(m.createdAt),
      })),
      skipDuplicates: true,
    });
  }

  if (pending.length) {
    await prisma.pendingOrder.createMany({
      data: pending.map(p => ({
        id: p.id,
        productId: p.productId,
        requestedById: p.requestedById,
        quantity: p.quantity,
        note: p.note || '',
        status: p.status || 'PENDENTE',
        createdAt: asDate(p.createdAt),
        updatedAt: asDate(p.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  if (media.length) {
    await prisma.mediaAsset.createMany({
      data: media.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        type: m.type || 'FOTO',
        url: m.url,
        uploadedById: m.uploadedById,
        createdAt: asDate(m.createdAt),
      })),
      skipDuplicates: true,
    });
  }

  if (audits.length) {
    await prisma.auditLog.createMany({
      data: audits.map(a => ({
        id: a.id,
        userId: a.userId,
        entity: a.entity,
        action: a.action,
        beforeJson: a.beforeJson,
        afterJson: a.afterJson,
        createdAt: asDate(a.createdAt),
      })),
      skipDuplicates: true,
    });
  }

  // Reset das sequences (autoincrement) para evitar colisão em inserts futuros
  const tables = [
    { name: 'User',         seq: 'User_id_seq' },
    { name: 'Product',      seq: 'Product_id_seq' },
    { name: 'Movement',     seq: 'Movement_id_seq' },
    { name: 'PendingOrder', seq: 'PendingOrder_id_seq' },
    { name: 'MediaAsset',   seq: 'MediaAsset_id_seq' },
    { name: 'AuditLog',     seq: 'AuditLog_id_seq' },
  ];
  for (const t of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval('"${t.seq}"', COALESCE((SELECT MAX(id) FROM "${t.name}"), 1), true)`
      );
    } catch (e) {
      console.warn(`Sequence reset falhou para ${t.name}:`, e.message);
    }
  }

  // Conferência final
  const finalCounts = {
    users:     await prisma.user.count(),
    products:  await prisma.product.count(),
    movements: await prisma.movement.count(),
    pending:   await prisma.pendingOrder.count(),
    media:     await prisma.mediaAsset.count(),
    audits:    await prisma.auditLog.count(),
  };
  console.log('\n✅ Migração concluída. Contagens no Neon:');
  console.table(finalCounts);
}

main()
  .catch(e => { console.error('❌ Erro:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); sqlite.close(); });
