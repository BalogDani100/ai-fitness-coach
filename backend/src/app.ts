import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { prisma } from './prisma';
import { authRouter } from './routes/auth.routes';
import { profileRouter } from './routes/profile.routes';
import { authGuard, AuthRequest } from './middlewares/auth.middleware';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/db-health', async (_req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      status: 'ok',
      userCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'DB connection failed',
    });
  }
});

app.use('/auth', authRouter);

app.use('/profile', profileRouter);

app.get('/me', authGuard, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  });

  res.json({ user });
});
