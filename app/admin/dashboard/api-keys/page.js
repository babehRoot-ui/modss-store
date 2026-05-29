'use client';

import { useState, useEffect } from 'react';
import { getApiKeys, createApiKey, deleteApiKey } from '@/lib/supabase';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    type: 'pterodactyl',
    name: '',
    api_key: '',
    client_token: '',
    domain: '',
  });

  useEffect(() => { loadKeys(); }, []);

  async function loadKeys() {
    try {
      const data = await getApiKeys();
      setKeys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const payload = {
      type: form.type,
      name: form.name || form.type,
      api_key: form.api_key,
    };

    if (form.type === 'pterodactyl') {
      payload.client_token = form.client_token || null;
      payload.domain = form.domain || null;
    }

    try {
      await createApiKey(payload);
      setShowForm(false);
      setForm({ type: 'pterodactyl', name: '', api_key: '', client_token: '', domain: '' });
      loadKeys();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus API Key ini?')) return;
    try {
      await deleteApiKey(id);
      loadKeys();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{keys.length} API keys tersimpan</p>
        <button onClick={() => { setFormError(''); setShowForm(true); }} className="btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah API Key
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-dark p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-sm">PT</div>
            <div>
              <h4 className="font-semibold">Pterodactyl</h4>
              <p className="text-xs text-gray-500">PLTA + PLTC + Domain</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Dibutuhkan untuk auto-provisioning server panel. Wajib isi PLTA, PLTC, dan Domain.</p>
        </div>
        <div className="card-dark p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 font-bold text-sm">DO</div>
            <div>
              <h4 className="font-semibold">DigitalOcean</h4>
              <p className="text-xs text-gray-500">API Key V2</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Dibutuhkan untuk auto-create VPS/Droplet. Ambil dari DigitalOcean Control Panel.</p>
        </div>
      </div>

      {/* Keys List */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tipe</th>
                <th>API Key</th>
                <th>Detail Tambahan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id}>
                  <td className="font-medium text-white">{k.name || '-'}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${k.type === 'pterodactyl' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                      {k.type === 'pterodactyl' ? 'Pterodactyl' : 'DigitalOcean'}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-gray-400 max-w-[120px] truncate">{k.api_key?.substring(0, 20)}...</td>
                  <td className="text-xs text-gray-400">
                    {k.type === 'pterodactyl' ? (
                      <div>
                        <div>Domain: {k.domain || '-'}</div>
                        <div>PLTC: {k.client_token ? '✓ Tersedia' : '✕ Kosong'}</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${k.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {k.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(k.id)} className="btn-danger text-xs">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {keys.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-500">Belum ada API key tersimpan</div>
        )}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-dark-400/30 flex items-center justify-between">
              <h3 className="font-bold">Tambah API Key</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center text-gray-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tipe *</label>
                <select className="input-dark" value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                  <option value="pterodactyl">Pterodactyl Panel</option>
                  <option value="do">DigitalOcean</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama</label>
                <input type="text" className="input-dark" placeholder="contoh: Panel Utama" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {form.type === 'pterodactyl' ? 'PLTA (Application API Key) *' : 'API Key *'}
                </label>
                <input type="text" className="input-dark font-mono text-xs" placeholder={form.type === 'pterodactyl' ? 'ptla_xxx...' : 'dop_v1_xxx...'} value={form.api_key} onChange={e => setForm(p => ({...p, api_key: e.target.value}))} required />
              </div>

              {form.type === 'pterodactyl' && (
                <>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-400">Untuk Pterodactyl, PLTC dan Domain WAJIB diisi!</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">PLTC (Client API Key) *</label>
                    <input type="text" className="input-dark font-mono text-xs" placeholder="ptlc_xxx..." value={form.client_token} onChange={e => setForm(p => ({...p, client_token: e.target.value}))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Domain Panel *</label>
                    <input type="url" className="input-dark" placeholder="https://panel.domain.com" value={form.domain} onChange={e => setForm(p => ({...p, domain: e.target.value}))} required />
                  </div>
                </>
              )}

              {formError && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{formError}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 disabled:opacity-50">
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
        }
