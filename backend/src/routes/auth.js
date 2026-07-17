import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { checkBusinessHours } from '../utils/businessHours.js';

const router = Router();

function serializeUser(user) {
  const effectiveName = user.displayNameSet && user.displayName ? user.displayName : user.name;
  return {
    id: user.id,
    email: user.email,
    nome: effectiveName,
    nomeOriginal: user.name,
    displayName: user.displayName || '',
    displayNameSet: !!user.displayNameSet,
    mustSetDisplayName: !user.displayNameSet && shouldPromptDisplayName(user),
    avatarUrl: user.avatarUrl || '',
    perfil: user.role,
    restricaoHorario: user.restrictBusiness,
    active: user.active,
  };
}

// Quais perfis precisam definir nome próprio no primeiro acesso.
function shouldPromptDisplayName(user) {
  return user.role === 'COMERCIAL' || user.role === 'DIRETORIA';
}

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

  return res.json({ ok: true, token, user: serializeUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ ok: false, error: 'Usuário não encontrado' });
  return res.json({ ok: true, user: serializeUser(user) });
});

// Define / atualiza o nome como o usuário quer ser tratado (perfil + chat).
router.post('/display-name', requireAuth, async (req, res) => {
  const raw = String(req.body?.displayName || '').trim();
  if (raw.length < 2 || raw.length > 40) {
    return res.status(400).json({ ok: false, error: 'O nome deve ter entre 2 e 40 caracteres.' });
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { displayName: raw, displayNameSet: true },
  });

  return res.json({ ok: true, user: serializeUser(user) });
});

// Define / atualiza o perfil pessoal completo: nome e/ou foto (avatar).
// O avatar deve vir como data URL (base64) ja redimensionado no frontend
// (sugestão: <= 256x256, <= 200 KB) para não estourar o limite do JSON.
router.post('/profile', requireAuth, async (req, res) => {
  const body = req.body || {};
  const data = {};

  if (typeof body.displayName === 'string') {
    const raw = body.displayName.trim();
    if (raw.length < 2 || raw.length > 40) {
      return res.status(400).json({ ok: false, error: 'O nome deve ter entre 2 e 40 caracteres.' });
    }
    data.displayName = raw;
    data.displayNameSet = true;
  }

  if (typeof body.avatarUrl === 'string') {
    const av = body.avatarUrl;
    // limite duro de segurança: ~300 KB de base64 (~225 KB de imagem)
    if (av.length > 320_000) {
      return res.status(413).json({ ok: false, error: 'Foto muito grande. Reduza para no maximo 200 KB.' });
    }
    if (av && !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(av)) {
      return res.status(400).json({ ok: false, error: 'Formato de imagem invalido. Use PNG, JPG, WEBP ou GIF.' });
    }
    data.avatarUrl = av;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ ok: false, error: 'Nada para atualizar.' });
  }

  const user = await prisma.user.update({ where: { id: req.user.id }, data });
  return res.json({ ok: true, user: serializeUser(user) });
});

export default router;
