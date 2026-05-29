'use client';

import { useState, useEffect } from 'react';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [form, setForm] = useState({ type:'pterodactyl', name:'', api_key:'', client_token:'', domain:'', config:'{}' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch('/api/admin/api-keys');
    const data = await res.json();
    setKeys(data.keys || []);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.api_key) return alert('Nama dan API Key wajib diisi');
    setSaving(true);
    let configObj = {};
    try { configObj = JSON.parse(form.config); } catch {}
    await fetch('/api/admin/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, config: configObj })
    });
    setForm({ type:'pterodactyl', name:'', api_key:'', client_token:'', domain:'', config:'{}' });
    setSaving(false); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus API Key ini?')) return;
    await fetch('/api/admin/api-keys', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Tambah API Key</h3>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tipe *</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field">
              <option value="pterodactyl">Pterodactyl</option><option value="do">DigitalOcean</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nama *</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" placeholder="Contoh: Panel Utama" required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{form.type === 'pterodactyl' ? 'PLTA (Application API Key)' : 'DO API Token'} *</label>
            <input type="password" value={form.api_key} onChange={e => setForm({...form, api_key: e.target.value})} className="input-field" required />
          </div>
          {form.type === 'pterodactyl' && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">PLTC (Client API Key) *</label>
                <input type="password" value={form.client_token} onChange={e => setForm({...form, client_token: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Domain Panel *</label>
                <input value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} className="input-field" placeholder="https://panel.example.com" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Config (JSON opsional)</label>
                <textarea value={form.config} onChange={e => setForm({...form, config: e.target.value})} className="input-field font-mono text-xs" rows={2} />
              </div>
            </>
          )}
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>

      {keys.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-500">Belum ada API Key.</div>
      ) : (
        <div className="space-y-3">
          {keys.map(k => (
            <div key={k.id} className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{k.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 text-gray-400 uppercase">{k.type === 'pterodactyl' ? 'Pterodactyl' : 'DigitalOcean'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${k.is_active ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-gray-500 border-gray-500/30'}`}>{k.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 font-mono truncate">Key: {k.api_key?.substring(0, 20)}...</p>
                {k.domain && <p className="text-xs text-gray-500 font-mono">{k.domain}</p>}
                {k.client_token && <p className="text-xs text-gray-500 font-mono">PLTC: {k.client_token.substring(0, 20)}...</p>}
              </div>
              <button onClick={() => handleDelete(k.id)} className="btn-danger text-xs py-1.5 px-3 flex-shrink-0">Hapus</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
        }
