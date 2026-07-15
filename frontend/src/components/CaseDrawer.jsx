import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import TierBadge from './TierBadge.jsx';

export default function CaseDrawer({ caseId, onClose, onChanged }) {
  const [c, setC] = useState(null);
  const [interns, setInterns] = useState([]);
  const [pros, setPros] = useState([]);
  const [assignee, setAssignee] = useState('');
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api(`/cases/${caseId}`).then(setC).catch((e) => setError(e.message));
  }, [caseId]);

  useEffect(() => {
    load();
    api('/interns').then(setInterns).catch(() => {});
    api('/professionals').then(setPros).catch(() => {});
  }, [load]);

  async function act(name, fn, message) {
    setBusy(name);
    setError('');
    try {
      await fn();
      load();
      onChanged(message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  function assign() {
    if (!assignee) return;
    const [kind, id] = assignee.split(':');
    const body = kind === 'intern' ? { internId: id } : { professionalId: id };
    act('assign', () => api(`/cases/${caseId}/assign`, { method: 'POST', body: JSON.stringify(body) }), 'Case assigned');
  }

  function escalate() {
    const reason = window.prompt('Reason for escalating to Tier 3:');
    if (reason === null) return;
    act('escalate', () => api(`/cases/${caseId}/escalate`, { method: 'POST', body: JSON.stringify({ reason }) }), 'Case escalated to Tier 3');
  }

  function close() {
    act('close', () => api(`/cases/${caseId}/close`, { method: 'POST' }), 'Case closed');
  }

  async function getSummary() {
    setBusy('summary');
    try {
      setSummary(await api(`/ai/case-summary/${caseId}`, { method: 'POST' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  if (!c) {
    return (
      <>
        <div className="drawer-overlay" onClick={onClose} />
        <div className="drawer"><div className="empty">{error || 'Loading…'}</div></div>
      </>
    );
  }

  const open = c.status !== 'closed';

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-label={`Case ${c.studentCode}`}>
        <button className="close" onClick={onClose} aria-label="Close">✕</button>
        <h2>{c.studentCode}</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0 4px' }}>
          <TierBadge tier={c.tier} />
          <span className={`status-pill ${c.status}`}>{c.status}</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14 }}>
          {c.college} · assessed {new Date(c.assessedAt).toLocaleString()}
        </div>

        <div className="caps" style={{ marginBottom: 6 }}>Classification (rule-based)</div>
        <div style={{ fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
          Score <strong>{c.totalScore}/48</strong>. {c.classificationReason}
        </div>

        {(c.assignedIntern || c.assignedProfessional) && (
          <div style={{ fontSize: 13, marginBottom: 16 }}>
            <span className="caps">Assigned to </span>
            <strong>
              {c.assignedIntern
                ? `${c.assignedIntern.name} (intern, supervised by ${c.assignedIntern.supervisor})`
                : `${c.assignedProfessional.name} (${c.assignedProfessional.specialization})`}
            </strong>
          </div>
        )}

        {open && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ flex: 1, minWidth: 180, border: '1.5px solid #e0d5c5e6', borderRadius: 10, padding: '7px 10px', background: 'var(--canvas2)' }}>
              <option value="">Assign to…</option>
              {c.tier < 3 && (
                <optgroup label="Interns (Tier 2)">
                  {interns.map((i) => (
                    <option key={i._id} value={`intern:${i._id}`}>
                      {i.name} — {i.activeCases} active
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Professionals">
                {pros.filter((p) => p.available).map((p) => (
                  <option key={p._id} value={`pro:${p._id}`}>
                    {p.name} — {p.specialization}
                  </option>
                ))}
              </optgroup>
            </select>
            <button className="btn sm" onClick={assign} disabled={!assignee || busy === 'assign'}>Assign</button>
            {c.tier < 3 && (
              <button className="btn sm warn" onClick={escalate} disabled={busy === 'escalate'}>Escalate to Tier 3</button>
            )}
            <button className="btn sm ghost" onClick={close} disabled={busy === 'close'}>Close case</button>
          </div>
        )}
        {error && <div className="login-error">{error}</div>}

        <h3 className="section-title">AI summary</h3>
        {summary ? (
          <div className={`ai-box${summary.fallback ? ' fallback' : ''}`}>{summary.summary}</div>
        ) : (
          <button className="btn sm ghost" onClick={getSummary} disabled={busy === 'summary'}>
            {busy === 'summary' ? 'Summarizing…' : 'Generate AI summary'}
          </button>
        )}

        <h3 className="section-title">Assessment responses</h3>
        {c.answers.map((a, i) => (
          <div className="answer-row" key={i}>
            <div className="q">Q{i + 1}. {a.question}</div>
            <div className="a">
              <span>{a.answer}</span>
              <span className={`score-chip score-${a.score}`}>{a.score}/4</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
