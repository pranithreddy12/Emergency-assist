import type { AdminUser, AuthUser } from '@emergencyai/sdk';
import { client } from '../api';
import { useAsync } from '../useAsync';

const ROLES: AuthUser['role'][] = ['USER', 'RESPONDER', 'HOSPITAL_STAFF', 'ADMIN'];

export function Users() {
  const { data, loading, error, reload } = useAsync(() => client.admin.listUsers(), []);

  const setRole = async (u: AdminUser, role: AuthUser['role']) => {
    await client.admin.updateUserRole(u.id, role);
    reload();
  };

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email / phone</th>
          <th>Provider</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map((u) => (
          <tr key={u.id}>
            <td>{u.displayName ?? (u.isGuest ? 'Guest' : '—')}</td>
            <td className="muted">{u.email ?? u.phone ?? '—'}</td>
            <td>{u.isGuest ? 'GUEST' : 'EMAIL'}</td>
            <td>
              <select value={u.role} onChange={(e) => setRole(u, e.target.value as AuthUser['role'])}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
