import bcrypt from 'bcryptjs';
import { Admin, StudentCase, Intern, Professional, Session, AuditLog } from '../models/index.js';
import { classify } from '../config/tiers.js';

// The 12-question assessment used by the student side (mirrored here for seeding).
export const QUESTIONS = [
  'Over the past two weeks, how often have you felt down, low, or hopeless?',
  'How well have you been sleeping recently?',
  'How often do you feel overwhelmed by academic pressure?',
  'How connected do you feel to friends or family?',
  'How often do you feel nervous, anxious, or on edge?',
  'Have you lost interest in activities you usually enjoy?',
  'How is your appetite and energy through the day?',
  'How often do you feel judged or afraid of being judged?',
  'Do you feel confident about your ability to handle your current workload?',
  'How often do you feel lonely even when around people?',
  'Have you had thoughts of harming yourself?',
  'Do you feel safe in your current living environment?',
];

const ANSWER_BANK = [
  ['Not at all', 'Rarely', 'Sometimes', 'Often', 'Nearly every day'],
  ['Very well', 'Mostly fine', 'Restless some nights', 'Poorly most nights', 'Barely sleeping'],
  ['Never', 'Occasionally', 'Weekly', 'Most days', 'Constantly'],
  ['Very connected', 'Connected', 'Somewhat distant', 'Isolated', 'Completely alone'],
  ['Not at all', 'Rarely', 'Sometimes', 'Often', 'Nearly every day'],
  ['No', 'Slightly', 'Somewhat', 'Mostly', 'Completely'],
  ['Normal', 'Slightly off', 'Noticeably reduced', 'Poor', 'Very poor'],
  ['Never', 'Rarely', 'Sometimes', 'Often', 'All the time'],
  ['Very confident', 'Confident', 'Unsure', 'Doubtful', 'Not at all'],
  ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  ['Never', 'Once, fleeting', 'Occasionally', 'Often', 'Frequently'],
  ['Completely safe', 'Safe', 'Mostly safe', 'Sometimes unsafe', 'Unsafe'],
];

const COLLEGES = [
  'Sri Krishna College of Arts and Science',
  'PSG College of Technology',
  'Kumaraguru College of Technology',
  'Coimbatore Institute of Technology',
];

// Deterministic pseudo-random so every seed run produces the same demo data.
function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function buildAnswers(rng, profile) {
  // profile: 'mild' | 'moderate' | 'high' — biases severity scores
  const bias = { mild: [0, 1.6], moderate: [1, 2.9], high: [2, 4.2] }[profile];
  return QUESTIONS.map((q, i) => {
    let score = Math.min(4, Math.max(0, Math.floor(bias[0] + rng() * (bias[1] - bias[0]))));
    // Keep safety-critical questions low except for a few high-risk students.
    if ((i === 10 || i === 11) && profile !== 'high') score = Math.min(score, 1);
    if ((i === 10 || i === 11) && profile === 'high') score = rng() > 0.5 ? 3 : 2;
    return { question: q, answer: ANSWER_BANK[i][score], score };
  });
}

export async function seedDatabase({ log = console.log } = {}) {
  const rng = makeRng(20260716);

  await Promise.all([
    Admin.deleteMany({}),
    StudentCase.deleteMany({}),
    Intern.deleteMany({}),
    Professional.deleteMany({}),
    Session.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  await Admin.create({
    email: 'admin@thenest.social',
    passwordHash: await bcrypt.hash('nest-admin-2026', 10),
    name: 'Nest Admin',
  });

  const interns = await Intern.insertMany([
    { name: 'Priya Raman', email: 'priya.r@skcas.edu', college: COLLEGES[0], supervisor: 'Dr. Meera Krishnan', sessionHours: 46 },
    { name: 'Arjun Venkatesh', email: 'arjun.v@psgtech.edu', college: COLLEGES[1], supervisor: 'Dr. Meera Krishnan', sessionHours: 31 },
    { name: 'Divya Subramani', email: 'divya.s@kct.edu', college: COLLEGES[2], supervisor: 'Dr. Rajan Iyer', sessionHours: 22 },
    { name: 'Karthik Mohan', email: 'karthik.m@cit.edu', college: COLLEGES[3], supervisor: 'Dr. Rajan Iyer', sessionHours: 12 },
    { name: 'Sneha Lakshmi', email: 'sneha.l@skcas.edu', college: COLLEGES[0], supervisor: 'Dr. Anitha Balan', sessionHours: 5 },
  ]);

  const professionals = await Professional.insertMany([
    { name: 'Dr. Meera Krishnan', email: 'meera@thenest.social', specialization: 'Clinical Psychology', yearsExperience: 14, ratePerSession: 1200 },
    { name: 'Dr. Rajan Iyer', email: 'rajan@thenest.social', specialization: 'Adolescent Counselling', yearsExperience: 11, ratePerSession: 1000 },
    { name: 'Dr. Anitha Balan', email: 'anitha@thenest.social', specialization: 'Anxiety & Stress Disorders', yearsExperience: 9, ratePerSession: 950 },
    { name: 'Dr. Suresh Nair', email: 'suresh@thenest.social', specialization: 'Depression & Mood Disorders', yearsExperience: 16, ratePerSession: 1500, available: false },
  ]);

  // ~60 cases spread over the last 30 days, weighted toward mild.
  const profiles = ['mild', 'mild', 'mild', 'moderate', 'moderate', 'high'];
  const cases = [];
  for (let i = 0; i < 60; i++) {
    const profile = profiles[Math.floor(rng() * profiles.length)];
    const answers = buildAnswers(rng, profile);
    const { tier, totalScore, reason } = classify(answers);
    const daysAgo = Math.floor(rng() * 30);
    const assessedAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000 - rng() * 12 * 3600 * 1000);

    cases.push({
      studentCode: `NEST-${String(1001 + i)}`,
      college: COLLEGES[Math.floor(rng() * COLLEGES.length)],
      answers,
      totalScore,
      tier,
      classificationReason: reason,
      status: 'new',
      assessedAt,
    });
  }
  const created = await StudentCase.insertMany(cases);

  await AuditLog.insertMany(
    created.map((c) => ({
      action: 'classified',
      case: c._id,
      studentCode: c.studentCode,
      detail: `Case ${c.studentCode} classified as Tier ${c.tier}. ${c.classificationReason}`,
      actor: 'system',
      createdAt: c.assessedAt,
    }))
  );

  // Give older cases some history: assign, complete sessions, escalate a couple.
  const sessions = [];
  const historyLogs = [];
  const activeCaseCounts = new Map(); // assignee id -> open-case count
  for (const c of created) {
    const ageDays = (Date.now() - c.assessedAt) / (24 * 3600 * 1000);
    if (ageDays < 3 || rng() < 0.3) continue; // recent ones stay 'new'

    if (c.tier === 1) {
      if (rng() < 0.7) {
        c.status = 'closed';
        historyLogs.push({ action: 'closed', case: c._id, studentCode: c.studentCode, detail: `Case ${c.studentCode} closed after AI self-help resources.`, actor: 'system', createdAt: new Date(c.assessedAt.getTime() + 3 * 24 * 3600 * 1000) });
      }
    } else if (c.tier === 2) {
      const intern = interns[Math.floor(rng() * interns.length)];
      c.assignedIntern = intern._id;
      const done = rng() < 0.6;
      c.status = done ? 'in-session' : 'assigned';
      activeCaseCounts.set(String(intern._id), (activeCaseCounts.get(String(intern._id)) || 0) + 1);
      sessions.push({ case: c._id, intern: intern._id, scheduledAt: new Date(c.assessedAt.getTime() + 2 * 24 * 3600 * 1000), outcome: done ? 'completed' : 'scheduled' });
      historyLogs.push({ action: 'assigned', case: c._id, studentCode: c.studentCode, detail: `Case ${c.studentCode} (Tier 2) assigned to intern ${intern.name}.`, actor: 'admin@thenest.social', createdAt: new Date(c.assessedAt.getTime() + 1 * 24 * 3600 * 1000) });
      if (!done && rng() < 0.25) {
        c.tier = 3;
        c.status = 'escalated';
        activeCaseCounts.set(String(c.assignedIntern), activeCaseCounts.get(String(c.assignedIntern)) - 1);
        c.assignedIntern = null;
        historyLogs.push({ action: 'escalated', case: c._id, studentCode: c.studentCode, detail: `Case ${c.studentCode} escalated Tier 2 → Tier 3. Reason: intern flagged worsening symptoms during session.`, actor: 'admin@thenest.social', createdAt: new Date(c.assessedAt.getTime() + 4 * 24 * 3600 * 1000) });
      }
    } else {
      const pro = professionals[Math.floor(rng() * 3)]; // skip the unavailable one
      c.assignedProfessional = pro._id;
      const done = rng() < 0.5;
      c.status = done ? 'in-session' : 'assigned';
      activeCaseCounts.set(String(pro._id), (activeCaseCounts.get(String(pro._id)) || 0) + 1);
      sessions.push({ case: c._id, professional: pro._id, scheduledAt: new Date(c.assessedAt.getTime() + 1 * 24 * 3600 * 1000), outcome: done ? 'completed' : 'scheduled' });
      historyLogs.push({ action: 'assigned', case: c._id, studentCode: c.studentCode, detail: `Case ${c.studentCode} (Tier 3) assigned to professional ${pro.name}.`, actor: 'admin@thenest.social', createdAt: new Date(c.assessedAt.getTime() + 12 * 3600 * 1000) });
    }
    await c.save();
  }
  await Session.insertMany(sessions);
  await AuditLog.insertMany(historyLogs);

  for (const [id, count] of activeCaseCounts) {
    if (count > 0) {
      await Intern.updateOne({ _id: id }, { activeCases: count });
      await Professional.updateOne({ _id: id }, { activeCases: count });
    }
  }

  // Certificate history for the top intern.
  await AuditLog.create({
    action: 'certificate-issued',
    detail: `Certificate issued to intern Priya Raman (46 supervised hours, supervisor: Dr. Meera Krishnan).`,
    actor: 'admin@thenest.social',
  });
  await Intern.updateOne({ name: 'Priya Raman' }, { certificateIssued: true, certificateIssuedAt: new Date() });

  const counts = {
    cases: created.length,
    interns: interns.length,
    professionals: professionals.length,
    sessions: sessions.length,
  };
  log(`Seeded: ${JSON.stringify(counts)}`);
  log('Admin login: admin@thenest.social / nest-admin-2026');
  return counts;
}
