import { client } from '../api';
import { useAsync } from '../useAsync';

export function Dashboard() {
  const overview = useAsync(() => client.analytics.overview(), []);
  const heatmap = useAsync(() => client.analytics.heatmap(), []);

  if (overview.loading) return <p className="muted">Loading…</p>;
  if (overview.error) return <p className="error">{overview.error}</p>;
  const o = overview.data!;

  const stats = [
    { l: 'Total incidents', n: o.totalIncidents },
    { l: 'Active', n: o.activeIncidents },
    { l: 'Resolved', n: o.resolvedIncidents },
    { l: 'Ambulance requests', n: o.ambulanceRequests },
    { l: 'Pre-arrivals', n: o.hospitalPrearrivals },
    { l: 'Ack rate', n: `${Math.round(o.prearrivalAckRate * 100)}%` },
  ];

  return (
    <div>
      <div className="grid">
        {stats.map((s) => (
          <div className="stat" key={s.l}>
            <div className="n">{s.n}</div>
            <div className="l">{s.l}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>By severity</h3>
      <div className="grid">
        {Object.entries(o.incidentsBySeverity).map(([sev, n]) => (
          <div className="stat" key={sev}>
            <div className="n">{n}</div>
            <div className="l">
              <span className={`badge sev-${sev}`}>{sev}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>Incident hotspots</h3>
      {heatmap.loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Incidents</th>
            </tr>
          </thead>
          <tbody>
            {(heatmap.data?.points ?? []).map((p, i) => (
              <tr key={i}>
                <td>{p.latitude}</td>
                <td>{p.longitude}</td>
                <td>{p.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
