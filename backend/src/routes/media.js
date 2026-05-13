import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const rows = await prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json({ ok: true, data: rows });
});

router.post('/', requireAuth, async (req, res) => {
  const { name, description, type, url } = req.body || {};
  const created = await prisma.mediaAsset.create({
    data: {
      name,
      description: description || '',
      type: type || 'FOTO',
      url,
      uploadedById: req.user.id,
    },
  });
  return res.status(201).json({ ok: true, data: created });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.mediaAsset.delete({ where: { id } });
  return res.json({ ok: true });
});

export default router;
