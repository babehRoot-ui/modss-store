'use client';

import { useState, useEffect } from 'react';

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [apiKeys, setApiKeys] = useState([]);

  useEffect(() => {
    fetch('/api/admin/api-keys').then(r => r.json()).then(data => {
      const ptKeys = (data.keys || []).filter(k => k.type === 'pterodactyl' && k.is_active && k.client_token);
      setApiKeys(ptKeys);
      if (ptKeys.length > 0) {
        setSelectedKey(ptKeys[0].id);
        fetchServers(ptKeys[0].id);
      } else { setLoading(false); }
    }).catch(() => setLoading(false));
  }, []);

  const fetchServers = async (keyId) => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/integration/pterodactyl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_servers', api_key_id: keyId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal fetch server');
      setServers(data.servers || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleChangeKey = (keyId) => {
    setSelectedKey(keyId);
    fetchServers(keyId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {apiKeys.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-500">
          <p>Belum ada API Key Pterodactyl dengan PLTC.</p>
          <p className="text-xs mt-1">Tambahkan di menu "API Keys" terlebih dahulu.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 flex-wrap">
            {apiKeys.map(k => (
              <button key={k.id} onClick={() => handleChangeKey(k.id)}
                className={`text-xs px-4 py-2 rounded-lg border transition ${selectedKey === k.id ? 'border-accent/30 bg-accent/10 text-accent' : 'border-white/10 text-gray-400 hover:text-white'}`}>
                {k.name} ({k.domain})
              </button>
            ))}
          </div>

          {loading ? <div className="text-center py-12 text-gray-400">Mengambil data server...</div> : error ? (
            <div className="glass-card p-6 text-center text-red-400">{error}</div>
          ) : servers.length === 0 ? (
            <div className="glass-card p-8 text-center text-gray-500">Tidak ada server ditemukan.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {servers.map(s => (
                <div key={s.attributes?.identifier || s.id} className="glass-card p-5 hover:glow-border transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.attributes?.status === 'running' ? 'bg-green-400' : s.attributes?.status === 'offline' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                      <span className="font-semibold text-white text-sm">{s.attributes?.name || 'Unknown'}</span>
                    </div>
                    <span className="font-mono text-xs text-gray-500">{s.attributes?.identifier?.substring(0, 8)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded-lg bg-dark-900/60">
                      <p className="text-xs text-gray-400">CPU</p>
                      <p className="text-sm font-semibold text-white">{s.attributes?.resources?.cpu_absolute || 0}%</p>
                    </div>
                    <div className="p-2 rounded-lg bg-dark-900/60">
                      <p className="text-xs text-gray-400">RAM</p>
                      <p className="text-sm font-semibold text-white">{s.attributes?.resources?.memory_bytes ? Math.round(s.attributes.resources.memory_bytes / 1024 / 1024) : 0} MB</p>
                    </div>
                    <div className="p-2 rounded-lg bg-dark-900/60">
                      <p className="text-xs text-gray-400">Disk</p>
                      <p className="text-sm font-semibold text-white">{s.attributes?.resources?.disk_bytes ? Math.round(s.attributes.resources.disk_bytes / 1024 / 1024) : 0} MB</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Node: {s.attributes?.node || '-'}</span>
                    <span className={`px-2 py-0.5 rounded-full border ${s.attributes?.status === 'running' ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-red-400 border-red-400/30 bg-red-400/10'}`}>{s.attributes?.status || 'unknown'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
