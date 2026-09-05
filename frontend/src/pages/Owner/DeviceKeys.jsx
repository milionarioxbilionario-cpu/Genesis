import React, { useEffect, useState } from 'react';
import db from '../../db/localDb';

export default function DeviceKeysPage() {
  const [keys, setKeys] = useState([]);
  const [deviceName, setDeviceName] = useState('');
  const [createdSecret, setCreatedSecret] = useState(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/device-keys', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (e) {
      console.error('failed to fetch device keys', e);
    }
  };

  const createKey = async () => {
    try {
      const res = await fetch('/api/device-keys', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_name: deviceName || 'device-' + Date.now() })
      });
      if (res.ok) {
        const body = await res.json();
        // Save secret locally in IndexedDB for background sync
        await db.device_keys.put({ id: body.id, device_name: deviceName || 'device', created_at: new Date().toISOString(), secret: body.secret });
        setCreatedSecret(body.secret);
        setDeviceName('');
        fetchKeys();
      } else {
        const err = await res.json();
        alert('Failed to create key: ' + (err && err.error));
      }
    } catch (e) {
      console.error('create key failed', e);
    }
  };

  const revokeKey = async (id) => {
    if (!confirm('Revoke this device key?')) return;
    try {
      const res = await fetch(`/api/device-keys/${id}/revoke`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        // remove local copy if present
        try { await db.device_keys.delete(id); } catch (e) {}
        fetchKeys();
      } else {
        const err = await res.json();
        alert('Failed to revoke: ' + (err && err.error));
      }
    } catch (e) {
      console.error('revoke failed', e);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Device Keys (Offline Sync)</h2>

      <div className="mb-4">
        <input placeholder="Device name" value={deviceName} onChange={e => setDeviceName(e.target.value)} className="border p-2 mr-2" />
        <button onClick={createKey} className="bg-blue-600 text-white px-3 py-1 rounded">Issue Key</button>
      </div>

      {createdSecret && (
        <div className="mb-4 p-3 bg-yellow-50 border">
          <p className="font-medium">New device key (shown once) — copy and store safely:</p>
          <code className="block break-all p-2 bg-white border mt-2">{createdSecret}</code>
        </div>
      )}

      <table className="w-full text-left">
        <thead>
          <tr><th>Device</th><th>Created</th><th>Last used</th><th>Revoked</th><th></th></tr>
        </thead>
        <tbody>
          {keys.map(k => (
            <tr key={k.id}>
              <td>{k.device_name}</td>
              <td>{k.created_at ? new Date(k.created_at).toLocaleString() : '-'}</td>
              <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : '-'}</td>
              <td>{k.revoked_at ? new Date(k.revoked_at).toLocaleString() : '-'}</td>
              <td><button onClick={() => revokeKey(k.id)} className="text-red-600">Revoke</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
