import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import movementsRoutes from './routes/movements.js';
import pendingRoutes from './routes/pendingOrders.js';
import mediaRoutes from './routes/media.js';
import usersRoutes from './routes/users.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, db: 'up' });
  } catch {
    return res.status(500).json({ ok: false, db: 'down' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/pending-orders', pendingRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/users', usersRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  return res.status(500).json({ ok: false, error: 'Erro interno' });
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
