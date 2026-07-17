import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ah } from '../lib/asyncHandler.js';

const router = Router();

// NOTA: a autenticação do SIZ é feita no cliente (lista de usuários no frontend).
// As rotas de dados ficam abertas para que o sync ao vivo (polling Neon) funcione
// para todos os logins. Ver routes/movements.js para a mesma decisão.

router.get('/', ah(async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: [{ name: 'asc' }] });
  return res.json({ ok: true, data: products });
}));

router.get('/alerts', ah(async (_req, res) => {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      alertEnabled: true,
      controlsStock: true,
    },
  });
  const alerts = products.filter((p) => p.stockCurrent <= p.stockMinimum);
  return res.json({ ok: true, data: alerts });
}));

router.post('/', ah(async (req, res) => {
  const body = req.body || {};
  if (!String(body.name || '').trim()) {
    return res.status(400).json({ ok: false, error: 'Nome do produto é obrigatório' });
  }
  const created = await prisma.product.create({
    data: {
      name: body.name,
      code: body.code || '',
      category: body.category || '',
      model: body.model || '',
      size: body.size || '',
      material: body.material || '',
      color: body.color || '',
      stockCurrent: Number(body.stockCurrent || 0),
      stockMinimum: Number(body.stockMinimum || 0),
      controlsStock: body.controlsStock ?? true,
      alertEnabled: body.alertEnabled ?? true,
      active: body.active ?? true,
      image: body.image || '',
      note: body.note || '',
    },
  });
  return res.status(201).json({ ok: true, data: created });
}));

router.put('/:id', ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: 'ID inválido' });
  }
  const body = req.body || {};

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ ok: false, error: `Produto ${id} não existe` });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      code: body.code,
      category: body.category,
      model: body.model,
      size: body.size,
      material: body.material,
      color: body.color,
      stockCurrent: body.stockCurrent != null ? Number(body.stockCurrent) : undefined,
      stockMinimum: body.stockMinimum != null ? Number(body.stockMinimum) : undefined,
      controlsStock: body.controlsStock,
      alertEnabled: body.alertEnabled,
      active: body.active,
      image: body.image,
      note: body.note,
    },
  });
  return res.json({ ok: true, data: updated });
}));

router.delete('/:id', ah(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ ok: false, error: 'ID inválido' });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ ok: false, error: `Produto ${id} não existe` });
  }

  await prisma.product.delete({ where: { id } });
  return res.json({ ok: true });
}));

export default router;
