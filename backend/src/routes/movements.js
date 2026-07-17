import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { ah } from '../lib/asyncHandler.js';

const router = Router();

// Autenticação é client-side no SIZ; rotas abertas para o sync ao vivo (ver products.js).

router.get('/', ah(async (_req, res) => {
  const rows = await prisma.movement.findMany({
    include: { product: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return res.json({ ok: true, data: rows });
}));

router.post('/', ah(async (req, res) => {
  const { productId, type, quantity, note } = req.body || {};
  const q = Number(quantity || 0);
  if (!productId || !type || q <= 0) return res.status(400).json({ ok: false, error: 'Dados inválidos' });

  const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
  if (!product) return res.status(404).json({ ok: false, error: 'Produto não encontrado' });

  let nextStock = product.stockCurrent;
  if (type === 'ENTRADA') nextStock += q;
  if (type === 'SAIDA') nextStock -= q;
  if (type === 'AJUSTE') nextStock = q;

  if (nextStock < 0) return res.status(400).json({ ok: false, error: 'Estoque não pode ficar negativo' });

  const [movement] = await prisma.$transaction([
    prisma.movement.create({
      data: {
        productId: product.id,
        userId: req.user?.id ?? null,
        type,
        quantity: q,
        note: note || '',
      },
    }),
    prisma.product.update({ where: { id: product.id }, data: { stockCurrent: nextStock } }),
  ]);

  return res.status(201).json({ ok: true, data: movement });
}));

export default router;
