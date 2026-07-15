import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import TierBadge from '../components/TierBadge.jsx';
import CaseDrawer from '../components/CaseDrawer.jsx';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (tier) params.set('tier', tier);
    if (status) params.set('status', status);
    api(`/cases?${params}`).then(setCases).catch(() => setCases([]));
  }, [tier, status]);

  useEffect(load, [load]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <>
      <h1>Case Queue</h1>
      <div className="sub">Students are anonymized — route each case to the right level of support.</div>

      <div className="filters">
        <select value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Filter by tier">
          <option value="">All tiers</option>
          <option value="1">Tier 1 — Mild</option>
          <option value="2">Tier 2 — Moderate</option>
          <option value="3">Tier 3 — High</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="assigned">Assigned</option>
          <option value="in-session">In session</option>
          <option value="escalated">Escalated</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="card" style={{ padding: 8 }}>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>College</th>
              <th>Tier</th>
              <th className="num">Score</th>
              <th>Status</th>
              <th>Assigned to</th>
              <th>Assessed</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c._id} className="clickable" onClick={() => setSelected(c._id)}>
                <td style={{ fontWeight: 600 }}>{c.studentCode}</td>
                <td>{c.college}</td>
                <td><TierBadge tier={c.tier} /></td>
                <td className="num">{c.totalScore}/48</td>
                <td><span className={`status-pill ${c.status}`}>{c.status}</span></td>
                <td>{c.assignedIntern?.name || c.assignedProfessional?.name || '—'}</td>
                <td>{new Date(c.assessedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {cases.length === 0 && <div className="empty">No cases match these filters.</div>}
      </div>

      {selected && (
        <CaseDrawer
          caseId={selected}
          onClose={() => setSelected(null)}
          onChanged={(msg) => {
            load();
            if (msg) showToast(msg);
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
