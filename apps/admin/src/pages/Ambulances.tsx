import type { Ambulance, AmbulanceStatus } from '@emergencyai/sdk';
import { client } from '../api';
import { useAsync } from '../useAsync';

const STATUSES: AmbulanceStatus[] = ['AVAILABLE', 'DISPATCHED', 'EN_ROUTE', 'BUSY', 'OFFLINE'];

export function Ambulances() {
  const { data, loading, error, reload } = useAsync(() => client.admin.listAmbulances(), []);

  const setStatus = async (a: Ambulance, status: AmbulanceStatus) => {
    await client.admin.updateAmbulance(a.id, { status });
    reload();
  };

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Vehicle</th>
          <th>Driver</th>
          <th>Type</th>
          <th>Status</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
        {(data ?? []).map((a) => (
          <tr key={a.id}>
            <td>{a.vehicleNumber}</td>
            <td>
              {a.driverName}
              <div className="muted">{a.driverPhone}</div>
            </td>
            <td>{a.type}</td>
            <td>
              <select
                value={a.status}
                onChange={(e) => setStatus(a, e.target.value as AmbulanceStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </td>
            <td className="muted">
              {a.latitude.toFixed(3)}, {a.longitude.toFixed(3)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
