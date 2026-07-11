import { useState } from 'react';
import { clearToken, hasToken } from './api';
import { Login } from './Login';
import { Dashboard } from './pages/Dashboard';
import { Hospitals } from './pages/Hospitals';
import { Ambulances } from './pages/Ambulances';
import { Users } from './pages/Users';
import { Incidents } from './pages/Incidents';

type Tab = 'dashboard' | 'hospitals' | 'ambulances' | 'users' | 'incidents';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'hospitals', label: 'Hospitals' },
  { key: 'ambulances', label: 'Ambulances' },
  { key: 'users', label: 'Users' },
  { key: 'incidents', label: 'Incidents' },
];

export function App() {
  const [authed, setAuthed] = useState(hasToken());
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  const logout = () => {
    clearToken();
    setAuthed(false);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">🚑 EmergencyAI</div>
        <nav className="nav">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        <div className="topbar">
          <h2>{TABS.find((t) => t.key === tab)?.label}</h2>
          <button className="secondary small" onClick={logout}>
            Log out
          </button>
        </div>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'hospitals' && <Hospitals />}
        {tab === 'ambulances' && <Ambulances />}
        {tab === 'users' && <Users />}
        {tab === 'incidents' && <Incidents />}
      </main>
    </div>
  );
}
