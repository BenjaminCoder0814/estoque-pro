import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// NOTA: a autenticação do SIZ é feita no cliente (lista de usuários no frontend).
// As rotas de dados ficam abertas para que o sync ao vivo (polling Neon) funcione
// para todos os logins. Ver routes/movements.js para a mesma decisão.

router.get('/', async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: [{ name: 'asc' }] });
  return res.json({ ok: true, data: products });
});

router.get('/alerts', async (_req, res) => {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      alertEnabled: true,
      controlsStock: true,
    },
  });
  const alerts = products.filter((p) => p.stockCurrent <= p.stockMinimum);
  return res.json({ ok: true, data: alerts });
});

router.post('/', async (req, res) => {
  const body = req.body || {};
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
    },
  });
  return res.status(201).json({ ok: true, data: created });
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
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
    },
  });
  return res.json({ ok: true, data: updated });
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.product.delete({ where: { id } });
  return res.json({ ok: true });
});

export default router;
