import { useState } from 'react';
import { client } from './api';

export function Login({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await client.login(email, password);
      // Confirm the account actually has admin rights before entering.
      const me = await client.me();
      if (me.role !== 'ADMIN') {
        setError('This account is not an administrator.');
        return;
      }
      onAuthed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card" onSubmit={submit}>
        <h1>🚑 EmergencyAI Admin</h1>
        <p className="muted">Sign in with an administrator account.</p>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
        {error && <div className="error">{error}</div>}
        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}
