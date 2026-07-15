import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setSession } from '../api.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(data.token, data.name);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-glow" aria-hidden="true" />
      <form className="login-card" onSubmit={submit}>
        <svg className="login-nest" viewBox="0 0 64 40" aria-hidden="true">
          <path d="M6 28c8 8 44 8 52 0" fill="none" stroke="var(--honey)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M12 23c7 6 33 6 40 0" fill="none" stroke="var(--moss)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M19 18c5 4 21 4 26 0" fill="none" stroke="var(--terracotta)" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="12" r="5" fill="var(--deep-pine)" />
        </svg>
        <div className="wordmark">nest</div>
        <p className="login-tag">a safe place to land</p>
        <p className="login-role">Admin console — case routing, rosters &amp; wellbeing trends</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@thenest.social"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="login-error">{error}</div>}

        <button className="btn" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="login-hint">
          <span className="caps">Demo access</span>
          admin@thenest.social <span className="sep">·</span> nest-admin-2026
        </div>
      </form>
      <div className="login-foot">Confidential — students are anonymized; every decision is audited.</div>
    </div>
  );
}
