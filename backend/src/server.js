import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';
import { requireAuth } from './middleware/auth.js';
import { StudentCase } from './models/index.js';
import { seedDatabase } from './seed/seedData.js';
import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import internRoutes from './routes/interns.js';
import professionalRoutes from './routes/professionals.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import auditRoutes from './routes/audit.js';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'nest-dev-secret-change-in-production';
  console.warn('JWT_SECRET not set — using a development default.');
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'nest-admin-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/cases', requireAuth, caseRoutes);
app.use('/api/interns', requireAuth, internRoutes);
app.use('/api/professionals', requireAuth, professionalRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use('/api/ai', requireAuth, aiRoutes);
app.use('/api/audit', requireAuth, auditRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8000;

const { ephemeral } = await connectDb();
if (ephemeral || (await StudentCase.countDocuments()) === 0) {
  await seedDatabase();
}

app.listen(PORT, () => console.log(`nest admin API listening on http://localhost:${PORT}`));
