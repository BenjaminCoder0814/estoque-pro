import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { ah } from '../lib/asyncHandler.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRoles('ADMIN', 'TI'), ah(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      restrictBusiness: true,
      createdAt: true,
    },
  });
  return res.json({ ok: true, data: users });
}));

router.post('/', requireAuth, requireRoles('ADMIN', 'TI'), ah(async (req, res) => {
  const { email, name, password, role, active, restrictBusiness } = req.body || {};
  const passwordHash = await bcrypt.hash(password || '123456', 10);
  const created = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: role || 'VISITANTE',
      active: active ?? true,
      restrictBusiness: restrictBusiness ?? false,
    },
  });
  return res.status(201).json({ ok: true, data: { id: created.id } });
}));

router.patch('/:id', requireAuth, requireRoles('ADMIN', 'TI'), ah(async (req, res) => {
  const id = Number(req.params.id);
  const { name, role, active, restrictBusiness, password } = req.body || {};
  const data = {
    name,
    role,
    active,
    restrictBusiness,
  };

  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return res.json({ ok: true, data: { id: updated.id } });
}));

router.delete('/:id', requireAuth, requireRoles('ADMIN', 'TI'), ah(async (req, res) => {
  const id = Number(req.params.id);

  if (req.user?.id === id) {
    return res.status(400).json({ ok: false, message: 'Nao e permitido excluir o proprio usuario logado.' });
  }

  await prisma.user.delete({ where: { id } });
  return res.json({ ok: true, data: { id } });
}));

export default router;
