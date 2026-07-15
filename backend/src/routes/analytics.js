import { Router } from 'express';
import { StudentCase, Intern, Professional, Session, AuditLog } from '../models/index.js';

const router = Router();

// All analytics are anonymized aggregates — no individual student data leaves here.
router.get('/overview', async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [tierCounts, statusCounts, escalationsThisWeek, internCount, proCount, sessionsCompleted] =
    await Promise.all([
      StudentCase.aggregate([
        { $match: { status: { $ne: 'closed' } } },
        { $group: { _id: '$tier', count: { $sum: 1 } } },
      ]),
      StudentCase.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      AuditLog.countDocuments({ action: 'escalated', createdAt: { $gte: weekAgo } }),
      Intern.countDocuments(),
      Professional.countDocuments({ available: true }),
      Session.countDocuments({ outcome: 'completed' }),
    ]);

  const tiers = { 1: 0, 2: 0, 3: 0 };
  tierCounts.forEach((t) => (tiers[t._id] = t.count));
  const statuses = {};
  statusCounts.forEach((s) => (statuses[s._id] = s.count));

  res.json({
    activeCasesByTier: tiers,
    casesByStatus: statuses,
    escalationsThisWeek,
    internCount,
    availableProfessionals: proCount,
    sessionsCompleted,
  });
});

// Assessments per day for the last N days (default 30), plus average risk score.
router.get('/trends', async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  since.setHours(0, 0, 0, 0);

  const daily = await StudentCase.aggregate([
    { $match: { assessedAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$assessedAt' } },
        assessments: { $sum: 1 },
        avgScore: { $avg: '$totalScore' },
        tier3: { $sum: { $cond: [{ $eq: ['$tier', 3] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(
    daily.map((d) => ({
      date: d._id,
      assessments: d.assessments,
      avgScore: Math.round(d.avgScore * 10) / 10,
      tier3: d.tier3,
    }))
  );
});

router.get('/intern-utilization', async (req, res) => {
  const interns = await Intern.find().select('name sessionHours activeCases certificateIssued');
  res.json(interns);
});

export default router;
