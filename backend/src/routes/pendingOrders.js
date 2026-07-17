import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ah } from '../lib/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, ah(async (_req, res) => {
  const rows = await prisma.pendingOrder.findMany({
    include: { product: true, requestedBy: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ ok: true, data: rows });
}));

router.post('/', requireAuth, ah(async (req, res) => {
  const { productId, quantity, note } = req.body || {};
  const created = await prisma.pendingOrder.create({
    data: {
      productId: Number(productId),
      requestedById: req.user.id,
      quantity: Number(quantity || 0),
      note: note || '',
    },
  });
  return res.status(201).json({ ok: true, data: created });
}));

router.patch('/:id/status', requireAuth, ah(async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  const updated = await prisma.pendingOrder.update({
    where: { id },
    data: { status },
  });
  return res.json({ ok: true, data: updated });
}));

export default router;
