import { useState } from 'react';
import { client } from '../api';
import { useAsync } from '../useAsync';

const STATUSES = ['', 'ACTIVE', 'DISPATCHED', 'EN_ROUTE', 'AT_HOSPITAL', 'RESOLVED', 'CANCELLED'];

export function Incidents() {
  const [status, setStatus] = useState('');
  const { data, loading, error } = useAsync(
    () => client.admin.listIncidents(status || undefined),
    [status],
  );

  return (
    <div>
      <div className="toolbar">
        <div>
          <label>Status filter</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s || 'All'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Chief complaint</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((inc) => (
              <tr key={inc.id}>
                <td>{inc.chiefComplaint ?? '—'}</td>
                <td>
                  {inc.severity ? (
                    <span className={`badge sev-${inc.severity}`}>{inc.severity}</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{inc.status}</td>
                <td>
                  {inc.triageReport?.confidence != null
                    ? `${Math.round(inc.triageReport.confidence * 100)}%`
                    : '—'}
                </td>
                <td className="muted">{new Date(inc.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
