import { Router } from 'express';
import { AuditLog } from '../models/index.js';

const router = Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  res.json(await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200));
});

export default router;
