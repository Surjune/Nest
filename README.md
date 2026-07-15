# nest — Admin Dashboard

Admin console for **The Nest**, a student mental-wellness triage platform. Students take a short psychology-based assessment on the student site ([thenest.social](https://thenest.social)) and are classified into a support tier; this dashboard is where college counsellors/administrators route those cases, manage the intern and professional rosters, and watch anonymized wellbeing trends.

## How the triage works

| Tier | Meaning | Support |
|------|---------|---------|
| Tier 1 | Mild | AI-recommended self-help (free) |
| Tier 2 | Moderate | One-on-one with a trained student intern (free, supervised) |
| Tier 3 | High | One-on-one with a licensed professional, 7+ yrs experience (paid) |

Classification is **rule-based and auditable** (`backend/src/config/tiers.js`): answer scores are summed against fixed thresholds, and a high score on any safety-critical question forces Tier 3 regardless of total. Every classification, assignment, escalation and certificate is written to the audit log.

## Features

- **Overview** — active cases per tier, escalations, 30-day assessment trend, tier distribution, AI wellbeing insight
- **Case Queue** — filterable anonymized cases; drawer with full assessment answers, score breakdown, AI case summary, assign / escalate / close actions
- **Interns** — roster with supervised hours, certificate issuing (40-hour threshold)
- **Professionals** — roster with specialization, rates, availability toggle
- **Audit Log** — every decision, traceable with actor and reason

## Tech stack

- **Frontend:** React 18 (Vite), React Router, Recharts
- **Backend:** Node.js, Express, Mongoose (MongoDB), JWT auth
- **AI:** Google Gemini (free tier) for case summaries and trend insights

## Getting started

Requires Node.js 18+.

```bash
# backend
cd backend
npm install
npm run dev        # http://localhost:8000

# frontend (in a second terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Demo login: `admin@thenest.social` / `nest-admin-2026`

With no configuration at all, the backend runs in **demo mode**: it starts an in-memory MongoDB and seeds it with realistic sample data on every start. Perfect for presentations.

## Configuration (optional)

Copy `backend/.env.example` to `backend/.env`:

- `GEMINI_API_KEY` — free key from [Google AI Studio](https://aistudio.google.com) ("Get API key"). Without it, AI cards show a friendly fallback message instead.
- `MONGODB_URI` — a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free M0 cluster (or local MongoDB) for persistent data. Run `npm run seed` once after setting it.
- `JWT_SECRET` — any long random string (signs admin login tokens).

## Privacy

Students are identified only by anonymous codes (e.g. `NEST-1042`). Analytics endpoints return aggregate counts only — no individual data leaves the case view, and institutions see trends, never identities.
