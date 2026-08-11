import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'service_desk', label: 'Service Desk' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'accounts', label: 'Accounts' },
];

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'service_desk' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="sidebar-brand-mark">D</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Dispatch</div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Service Desk</div>
          </div>
        </div>

        <div className="login-title">{mode === 'login' ? 'Sign in' : 'Create an account'}</div>
        <div className="login-sub">
          {mode === 'login' ? 'Access the dispatch console.' : 'First time here? Set up your login.'}
        </div>

        {error && <div className="banner banner-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label>Full name</label>
              <input required value={form.name} onChange={set('name')} placeholder="Sana Desk" />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input required type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              minLength={mode === 'register' ? 8 : undefined}
            />
            {mode === 'register' && <span className="field-hint">At least 8 characters.</span>}
          </div>
          {mode === 'register' && (
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={set('role')}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--ink-soft)' }}>
          {mode === 'login' ? (
            <>
              New here?{' '}
              <button onClick={() => setMode('register')} style={{ color: 'var(--accent)', fontWeight: 500 }}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} style={{ color: 'var(--accent)', fontWeight: 500 }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
