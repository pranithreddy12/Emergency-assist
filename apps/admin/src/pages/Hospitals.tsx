import { useState } from 'react';
import type { Hospital } from '@emergencyai/sdk';
import { client } from '../api';
import { useAsync } from '../useAsync';

const BLANK = { name: '', address: '', latitude: '', longitude: '', phone: '' };

export function Hospitals() {
  const { data, loading, error, reload } = useAsync(() => client.admin.listHospitals(), []);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setFormError(null);
    try {
      await client.admin.createHospital({
        name: form.name,
        address: form.address,
        phone: form.phone || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });
      setForm(BLANK);
      reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (h: Hospital) => {
    if (!confirm(`Delete ${h.name}?`)) return;
    await client.admin.deleteHospital(h.id);
    reload();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label>Address</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label>Lat</label>
          <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        </div>
        <div>
          <label>Lng</label>
          <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        </div>
        <div style={{ alignSelf: 'end' }}>
          <button onClick={create} disabled={busy || !form.name || !form.latitude}>
            Add hospital
          </button>
        </div>
      </div>
      {formError && <div className="error">{formError}</div>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Capabilities</th>
              <th>Rating</th>
              <th>Beds</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                <td className="muted">{h.address}</td>
                <td>{h.capabilities.join(', ') || '—'}</td>
                <td>{h.rating.toFixed(1)}</td>
                <td>{h.availableBeds ?? '—'}</td>
                <td className="row-actions">
                  <button className="secondary small" onClick={() => remove(h)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
