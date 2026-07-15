import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Professionals() {
  const [pros, setPros] = useState([]);
  const [error, setError] = useState('');

  function load() {
    api('/professionals').then(setPros).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function toggle(pro) {
    setError('');
    try {
      await api(`/professionals/${pro._id}/toggle-availability`, { method: 'POST' });
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <h1>Professionals</h1>
      <div className="sub">Licensed therapists (7+ years experience) handling Tier 3 cases and supervising interns.</div>
      {error && <div className="login-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ padding: 8 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th className="num">Experience</th>
              <th className="num">Rate / session</th>
              <th className="num">Active cases</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody>
            {pros.map((p) => (
              <tr key={p._id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td>{p.specialization}</td>
                <td className="num">{p.yearsExperience} yrs</td>
                <td className="num">₹{p.ratePerSession}</td>
                <td className="num">{p.activeCases}</td>
                <td>
                  <button
                    className={`btn sm ${p.available ? 'ghost' : ''}`}
                    onClick={() => toggle(p)}
                    title="Toggle availability"
                  >
                    {p.available ? 'Accepting cases' : 'Unavailable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pros.length === 0 && <div className="empty">No professionals yet.</div>}
      </div>
    </>
  );
}
