import { Router } from 'express';
import { Intern, AuditLog } from '../models/index.js';

const router = Router();
const CERTIFICATE_HOURS_REQUIRED = 40;

router.get('/', async (req, res) => {
  res.json(await Intern.find().sort({ sessionHours: -1 }));
});

router.post('/', async (req, res) => {
  const { name, email, college, supervisor } = req.body || {};
  if (!name || !email || !college || !supervisor) {
    return res.status(400).json({ error: 'name, email, college and supervisor are required' });
  }
  res.status(201).json(await Intern.create({ name, email, college, supervisor }));
});

router.post('/:id/log-hours', async (req, res) => {
  const hours = Number(req.body?.hours);
  if (!hours || hours <= 0) return res.status(400).json({ error: 'hours must be a positive number' });

  const intern = await Intern.findByIdAndUpdate(
    req.params.id,
    { $inc: { sessionHours: hours } },
    { new: true }
  );
  if (!intern) return res.status(404).json({ error: 'Intern not found' });
  res.json(intern);
});

router.post('/:id/issue-certificate', async (req, res) => {
  const intern = await Intern.findById(req.params.id);
  if (!intern) return res.status(404).json({ error: 'Intern not found' });
  if (intern.certificateIssued) return res.status(400).json({ error: 'Certificate already issued' });
  if (intern.sessionHours < CERTIFICATE_HOURS_REQUIRED) {
    return res.status(400).json({
      error: `Needs ${CERTIFICATE_HOURS_REQUIRED} supervised hours — currently ${intern.sessionHours}`,
    });
  }

  intern.certificateIssued = true;
  intern.certificateIssuedAt = new Date();
  await intern.save();

  await AuditLog.create({
    action: 'certificate-issued',
    detail: `Certificate issued to intern ${intern.name} (${intern.sessionHours} supervised hours, supervisor: ${intern.supervisor}).`,
    actor: req.admin.email,
  });

  res.json(intern);
});

export default router;
