import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

const answerSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 4 },
  },
  { _id: false }
);

const studentCaseSchema = new Schema(
  {
    // Students stay anonymous to admins — only a code is ever shown.
    studentCode: { type: String, required: true, unique: true },
    college: { type: String, required: true },
    answers: [answerSchema],
    totalScore: { type: Number, required: true },
    tier: { type: Number, enum: [1, 2, 3], required: true },
    classificationReason: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'assigned', 'in-session', 'escalated', 'closed'],
      default: 'new',
    },
    assignedIntern: { type: Schema.Types.ObjectId, ref: 'Intern', default: null },
    assignedProfessional: { type: Schema.Types.ObjectId, ref: 'Professional', default: null },
    assessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const internSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    college: { type: String, required: true },
    supervisor: { type: String, required: true }, // licensed professional overseeing them
    sessionHours: { type: Number, default: 0 },
    activeCases: { type: Number, default: 0 },
    certificateIssued: { type: Boolean, default: false },
    certificateIssuedAt: { type: Date, default: null },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const professionalSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    specialization: { type: String, required: true },
    yearsExperience: { type: Number, required: true, min: 7 },
    ratePerSession: { type: Number, required: true },
    available: { type: Boolean, default: true },
    activeCases: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const sessionSchema = new Schema(
  {
    case: { type: Schema.Types.ObjectId, ref: 'StudentCase', required: true },
    intern: { type: Schema.Types.ObjectId, ref: 'Intern', default: null },
    professional: { type: Schema.Types.ObjectId, ref: 'Professional', default: null },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 45 },
    outcome: {
      type: String,
      enum: ['scheduled', 'completed', 'no-show', 'escalated'],
      default: 'scheduled',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const auditLogSchema = new Schema(
  {
    action: {
      type: String,
      enum: ['classified', 'assigned', 'escalated', 'closed', 'certificate-issued'],
      required: true,
    },
    case: { type: Schema.Types.ObjectId, ref: 'StudentCase', default: null },
    studentCode: { type: String, default: null },
    detail: { type: String, required: true },
    actor: { type: String, default: 'system' }, // 'system' or admin email
  },
  { timestamps: true }
);

export const Admin = model('Admin', adminSchema);
export const StudentCase = model('StudentCase', studentCaseSchema);
export const Intern = model('Intern', internSchema);
export const Professional = model('Professional', professionalSchema);
export const Session = model('Session', sessionSchema);
export const AuditLog = model('AuditLog', auditLogSchema);
