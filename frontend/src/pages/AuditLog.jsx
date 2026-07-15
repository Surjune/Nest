import { useEffect, useState } from 'react';
import { api } from '../api.js';

const ACTION_STYLES = {
  classified: 'status-pill',
  assigned: 'badge tier-1',
  escalated: 'badge tier-3',
  closed: 'status-pill closed',
  'certificate-issued': 'badge tier-2',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = action ? `?action=${action}` : '';
    api(`/audit${params}`).then(setLogs).catch((e) => setError(e.message));
  }, [action]);

  return (
    <>
      <h1>Audit Log</h1>
      <div className="sub">Every classification, routing decision and escalation — traceable for safety review.</div>
      {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="filters">
        <select value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action">
          <option value="">All actions</option>
          <option value="classified">Classified</option>
          <option value="assigned">Assigned</option>
          <option value="escalated">Escalated</option>
          <option value="closed">Closed</option>
          <option value="certificate-issued">Certificate issued</option>
        </select>
      </div>

      <div className="card" style={{ padding: 8 }}>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Detail</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleString()}</td>
                <td>
                  <span className={ACTION_STYLES[l.action] || 'status-pill'}>
                    {l.action === 'escalated' && <span className="dot" />}
                    {l.action}
                  </span>
                </td>
                <td>{l.detail}</td>
                <td style={{ color: 'var(--muted)' }}>{l.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="empty">No audit entries.</div>}
      </div>
    </>
  );
}
