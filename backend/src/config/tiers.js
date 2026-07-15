// Rule-based risk classification — the single auditable source of truth.
// Each assessment answer is scored 0–4 (0 = no concern, 4 = severe).
// The total across all questions maps to a tier via these thresholds.

export const QUESTION_COUNT = 12;
export const MAX_SCORE = QUESTION_COUNT * 4; // 48

export const TIERS = {
  1: {
    name: 'Tier 1',
    label: 'Mild — AI self-help',
    min: 0,
    max: 16,
    route: 'AI-recommended insights (free)',
  },
  2: {
    name: 'Tier 2',
    label: 'Moderate — intern session',
    min: 17,
    max: 30,
    route: 'One-on-one with trained student intern (free)',
  },
  3: {
    name: 'Tier 3',
    label: 'High — licensed professional',
    min: 31,
    max: MAX_SCORE,
    route: 'One-on-one with licensed professional (paid)',
  },
};

// Any single answer at the maximum on a safety-critical question
// forces Tier 3 regardless of total score.
export const SAFETY_CRITICAL_QUESTIONS = [10, 11]; // indices into the questionnaire
export const SAFETY_CRITICAL_THRESHOLD = 3;

export function classify(answers) {
  const total = answers.reduce((s, a) => s + a.score, 0);

  for (const idx of SAFETY_CRITICAL_QUESTIONS) {
    if (answers[idx] && answers[idx].score >= SAFETY_CRITICAL_THRESHOLD) {
      return {
        tier: 3,
        totalScore: total,
        reason: `Safety-critical response on Q${idx + 1} ("${answers[idx].question}") scored ${answers[idx].score}/4 — forced Tier 3 escalation.`,
      };
    }
  }

  for (const [tier, def] of Object.entries(TIERS)) {
    if (total >= def.min && total <= def.max) {
      return {
        tier: Number(tier),
        totalScore: total,
        reason: `Total score ${total}/${MAX_SCORE} falls in ${def.name} range (${def.min}–${def.max}).`,
      };
    }
  }
  return { tier: 3, totalScore: total, reason: `Score ${total} out of range — defaulted to Tier 3 for safety.` };
}
