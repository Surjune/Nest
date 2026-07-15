import { Router } from 'express';
import { Professional } from '../models/index.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(await Professional.find().sort({ yearsExperience: -1 }));
});

router.post('/', async (req, res) => {
  const { name, email, specialization, yearsExperience, ratePerSession } = req.body || {};
  if (!name || !email || !specialization || !yearsExperience || !ratePerSession) {
    return res.status(400).json({ error: 'name, email, specialization, yearsExperience and ratePerSession are required' });
  }
  if (Number(yearsExperience) < 7) {
    return res.status(400).json({ error: 'Professionals must have at least 7 years of experience' });
  }
  res.status(201).json(await Professional.create({ name, email, specialization, yearsExperience, ratePerSession }));
});

router.post('/:id/toggle-availability', async (req, res) => {
  const pro = await Professional.findById(req.params.id);
  if (!pro) return res.status(404).json({ error: 'Professional not found' });
  pro.available = !pro.available;
  await pro.save();
  res.json(pro);
});

export default router;
