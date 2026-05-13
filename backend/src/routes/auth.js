import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { checkBusinessHours } from '../utils/businessHours.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email e senha são obrigatórios' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return res.status(401).json({ ok: false, error: 'Credenciais inválidas' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ ok: false, error: 'Credenciais inválidas' });

  if (user.restrictBusiness) {
    const hours = checkBusinessHours();
    if (!hours.ok) return res.status(403).json({ ok: false, error: `Fora do horário comercial. ${hours.reason}` });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return res.json({
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      nome: user.name,
      perfil: user.role,
      restricaoHorario: user.restrictBusiness,
    },
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });

  return res.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      nome: user.name,
      perfil: user.role,
      restricaoHorario: user.restrictBusiness,
      active: user.active,
    },
  });
});

export default router;
