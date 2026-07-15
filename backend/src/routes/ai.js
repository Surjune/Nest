import { Router } from 'express';
import { StudentCase } from '../models/index.js';
import { generate, aiEnabled } from '../services/gemini.js';
import { TIERS } from '../config/tiers.js';

const router = Router();

const NO_KEY_MESSAGE =
  'AI insights are not configured yet. Add GEMINI_API_KEY to backend/.env (free key from aistudio.google.com) to enable this.';

router.get('/status', (req, res) => {
  res.json({ enabled: aiEnabled() });
});

// Plain-language summary of one case's assessment for the reviewing admin.
router.post('/case-summary/:id', async (req, res) => {
  const c = await StudentCase.findById(req.params.id);
  if (!c) return res.status(404).json({ error: 'Case not found' });

  const answerLines = c.answers
    .map((a, i) => `Q${i + 1}: ${a.question} — "${a.answer}" (severity ${a.score}/4)`)
    .join('\n');

  const prompt = `You are assisting a college mental-health admin reviewing an anonymized student wellness assessment on a triage platform called "nest".
The student is identified only as ${c.studentCode}. Rule-based classification already placed them in ${TIERS[c.tier].name} (${TIERS[c.tier].label}) with reason: ${c.classificationReason}

Assessment responses:
${answerLines}

Write a concise 3-4 sentence summary for the admin: the student's main areas of concern, notable patterns across answers, and what kind of support focus would help. Do not diagnose. Do not repeat the tier decision — it is already made. Plain text only, no markdown.`;

  const { fallback, text } = await generate(prompt);
  res.json({ summary: fallback ? NO_KEY_MESSAGE : text, fallback });
});

// One-paragraph institutional insight for the overview page.
router.post('/trend-insight', async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [recent, tierCounts] = await Promise.all([
    StudentCase.countDocuments({ assessedAt: { $gte: weekAgo } }),
    StudentCase.aggregate([{ $group: { _id: '$tier', count: { $sum: 1 }, avgScore: { $avg: '$totalScore' } } }]),
  ]);

  const tierSummary = tierCounts
    .sort((a, b) => a._id - b._id)
    .map((t) => `Tier ${t._id}: ${t.count} cases, avg score ${t.avgScore.toFixed(1)}`)
    .join('; ');

  const prompt = `You are writing a short institutional wellness insight for college administrators on a student mental-health triage platform called "nest". All data is anonymized and aggregate.

This week: ${recent} new assessments. Overall case distribution — ${tierSummary}.

Write one warm but professional paragraph (3-4 sentences) interpreting these trends for the administration: what the distribution suggests about the student body's wellbeing and one practical, stigma-free suggestion the institution could act on. Plain text only, no markdown.`;

  const { fallback, text } = await generate(prompt);
  res.json({ insight: fallback ? NO_KEY_MESSAGE : text, fallback });
});

export default router;
