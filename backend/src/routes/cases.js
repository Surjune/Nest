import { Router } from 'express';
import { StudentCase, Intern, Professional, Session, AuditLog } from '../models/index.js';

const router = Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.tier) filter.tier = Number(req.query.tier);
  if (req.query.status) filter.status = req.query.status;

  const cases = await StudentCase.find(filter)
    .populate('assignedIntern', 'name')
    .populate('assignedProfessional', 'name')
    .sort({ assessedAt: -1 });
  res.json(cases);
});

router.get('/:id', async (req, res) => {
  const c = await StudentCase.findById(req.params.id)
    .populate('assignedIntern', 'name email supervisor')
    .populate('assignedProfessional', 'name email specialization');
  if (!c) return res.status(404).json({ error: 'Case not found' });
  res.json(c);
});

// Assign a case to an intern (Tier 2) or professional (Tier 3).
router.post('/:id/assign', async (req, res) => {
  const { internId, professionalId } = req.body || {};
  const c = await StudentCase.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  if (c.status === 'closed') return res.status(400).json({ error: 'Case is closed' });

  let assigneeName;
  if (internId) {
    if (c.tier === 3) return res.status(400).json({ error: 'Tier 3 cases require a licensed professional' });
    const intern = await Intern.findById(internId);
    if (!intern) return res.status(404).json({ error: 'Intern not found' });
    c.assignedIntern = intern._id;
    c.assignedProfessional = null;
    intern.activeCases += 1;
    await intern.save();
    assigneeName = `intern ${intern.name}`;
  } else if (professionalId) {
    const pro = await Professional.findById(professionalId);
    if (!pro) return res.status(404).json({ error: 'Professional not found' });
    if (!pro.available) return res.status(400).json({ error: `${pro.name} is not accepting cases right now` });
    c.assignedProfessional = pro._id;
    c.assignedIntern = null;
    pro.activeCases += 1;
    await pro.save();
    assigneeName = `professional ${pro.name}`;
  } else {
    return res.status(400).json({ error: 'internId or professionalId required' });
  }

  c.status = 'assigned';
  await c.save();

  await Session.create({
    case: c._id,
    intern: c.assignedIntern,
    professional: c.assignedProfessional,
    scheduledAt: new Date(Date.now() + 24 * 3600 * 1000),
  });
  await AuditLog.create({
    action: 'assigned',
    case: c._id,
    studentCode: c.studentCode,
    detail: `Case ${c.studentCode} (Tier ${c.tier}) assigned to ${assigneeName}.`,
    actor: req.admin.email,
  });

  res.json(await c.populate(['assignedIntern', 'assignedProfessional']));
});

// Escalate a case to Tier 3.
router.post('/:id/escalate', async (req, res) => {
  const { reason } = req.body || {};
  const c = await StudentCase.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });
  if (c.tier === 3) return res.status(400).json({ error: 'Case is already Tier 3' });

  const fromTier = c.tier;
  if (c.assignedIntern) {
    await Intern.findByIdAndUpdate(c.assignedIntern, { $inc: { activeCases: -1 } });
    c.assignedIntern = null;
  }
  c.tier = 3;
  c.status = 'escalated';
  await c.save();

  await AuditLog.create({
    action: 'escalated',
    case: c._id,
    studentCode: c.studentCode,
    detail: `Case ${c.studentCode} escalated Tier ${fromTier} → Tier 3. Reason: ${reason || 'not specified'}.`,
    actor: req.admin.email,
  });

  res.json(c);
});

router.post('/:id/close', async (req, res) => {
  const c = await StudentCase.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });

  if (c.assignedIntern) await Intern.findByIdAndUpdate(c.assignedIntern, { $inc: { activeCases: -1 } });
  if (c.assignedProfessional) await Professional.findByIdAndUpdate(c.assignedProfessional, { $inc: { activeCases: -1 } });

  c.status = 'closed';
  await c.save();

  await AuditLog.create({
    action: 'closed',
    case: c._id,
    studentCode: c.studentCode,
    detail: `Case ${c.studentCode} closed.`,
    actor: req.admin.email,
  });

  res.json(c);
});

export default router;
