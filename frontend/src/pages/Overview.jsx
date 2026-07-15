import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../api.js';

const TIER_COLORS = { 1: 'var(--tier-1)', 2: 'var(--tier-2)', 3: 'var(--tier-3)' };
const TIER_HEX = { 1: '#3f8a58', 2: '#b8801f', 3: '#b25538' };

const tooltipStyle = {
  background: '#faf6f0',
  border: '1px solid #e0d5c5',
  borderRadius: 10,
  fontSize: 12.5,
  fontFamily: "'DM Sans', sans-serif",
};

export default function Overview() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [insight, setInsight] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/analytics/overview').then(setOverview).catch((e) => setError(e.message));
    api('/analytics/trends?days=30').then(setTrends).catch(() => {});
    api('/ai/trend-insight', { method: 'POST' }).then(setInsight).catch(() => {});
  }, []);

  if (error) return <div className="empty">{error}</div>;
  if (!overview) return <div className="empty">Loading…</div>;

  const tierData = [1, 2, 3].map((t) => ({
    name: `Tier ${t}`,
    value: overview.activeCasesByTier[t] || 0,
    tier: t,
  }));

  return (
    <>
      <h1>Overview</h1>
      <div className="sub">Anonymized, aggregate wellbeing picture across partner institutions.</div>

      <div className="tiles">
        <div className="tile">
          <div className="caps">Active · Tier 1</div>
          <div className="value" style={{ color: TIER_HEX[1] }}>{overview.activeCasesByTier[1] || 0}</div>
          <div className="hint">AI self-help (free)</div>
        </div>
        <div className="tile">
          <div className="caps">Active · Tier 2</div>
          <div className="value" style={{ color: TIER_HEX[2] }}>{overview.activeCasesByTier[2] || 0}</div>
          <div className="hint">Intern sessions (free)</div>
        </div>
        <div className="tile">
          <div className="caps">Active · Tier 3</div>
          <div className="value" style={{ color: TIER_HEX[3] }}>{overview.activeCasesByTier[3] || 0}</div>
          <div className="hint">Licensed professionals</div>
        </div>
        <div className="tile">
          <div className="caps">Escalations · 7 days</div>
          <div className="value">{overview.escalationsThisWeek}</div>
          <div className="hint">Tier upgrades this week</div>
        </div>
        <div className="tile">
          <div className="caps">Sessions completed</div>
          <div className="value">{overview.sessionsCompleted}</div>
          <div className="hint">
            {overview.internCount} interns · {overview.availableProfessionals} pros available
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="caps" style={{ marginBottom: 12 }}>Assessments — last 30 days</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trends} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#e0d5c5" strokeWidth={0.75} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#898781' }}
                tickFormatter={(d) => d.slice(5)}
                stroke="#c3c2b7"
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#898781' }} stroke="transparent" tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="assessments"
                name="Assessments"
                stroke="#2f4c3a"
                strokeWidth={2}
                fill="#5c7a66"
                fillOpacity={0.18}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="caps" style={{ marginBottom: 12 }}>Active cases by tier</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={tierData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
                stroke="#faf6f0"
                strokeWidth={2}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
                fontSize={12}
              >
                {tierData.map((d) => (
                  <Cell key={d.tier} fill={TIER_HEX[d.tier]} />
                ))}
              </Pie>
              <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12.5 }} />
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h3 className="section-title">AI wellbeing insight</h3>
      <div className={`ai-box${insight?.fallback ? ' fallback' : ''}`}>
        {insight ? insight.insight : 'Generating insight…'}
      </div>
    </>
  );
}
