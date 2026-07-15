import { useEffect, useState } from 'react';
import { api } from '../api.js';

const CERT_HOURS = 40;

export default function Interns() {
  const [interns, setInterns] = useState([]);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  function load() {
    api('/interns').then(setInterns).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function issueCertificate(intern) {
    setError('');
    try {
      await api(`/interns/${intern._id}/issue-certificate`, { method: 'POST' });
      load();
      showToast(`Certificate issued to ${intern.name}`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function logHours(intern) {
    const hours = window.prompt(`Supervised hours to log for ${intern.name}:`, '2');
    if (hours === null) return;
    setError('');
    try {
      await api(`/interns/${intern._id}/log-hours`, { method: 'POST', body: JSON.stringify({ hours: Number(hours) }) });
      load();
      showToast(`${hours}h logged for ${intern.name}`);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <h1>Interns</h1>
      <div className="sub">
        Psychology students from partner colleges — {CERT_HOURS} supervised hours earns their certificate.
      </div>
      {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ padding: 8 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>College</th>
              <th>Supervisor</th>
              <th className="num">Hours</th>
              <th className="num">Active cases</th>
              <th>Certificate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {interns.map((i) => (
              <tr key={i._id}>
                <td style={{ fontWeight: 600 }}>{i.name}</td>
                <td>{i.college}</td>
                <td>{i.supervisor}</td>
                <td className="num">{i.sessionHours}</td>
                <td className="num">{i.activeCases}</td>
                <td>
                  {i.certificateIssued ? (
                    <span className="badge tier-1"><span className="dot" />Issued</span>
                  ) : (
                    <span className="status-pill">{Math.max(0, CERT_HOURS - i.sessionHours)}h to go</span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn sm ghost" onClick={() => logHours(i)}>Log hours</button>
                    {!i.certificateIssued && (
                      <button className="btn sm" onClick={() => issueCertificate(i)} disabled={i.sessionHours < CERT_HOURS}>
                        Issue certificate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {interns.length === 0 && <div className="empty">No interns yet.</div>}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
