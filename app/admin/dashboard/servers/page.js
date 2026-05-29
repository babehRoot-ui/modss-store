'use client';

import { useState, useEffect } from 'react';
import { getApiKeys } from '@/lib/supabase';
import { pteroRequest, getServerResources } from '@/lib/pterodactyl';

export default function ServersPage() {
  const [pteroKeys, setPteroKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [servers, setServers] = useState([]);
  const [resources, setResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const keys = await getApiKeys('pterodactyl');
      setPteroKeys(keys);
      if (keys.length > 0) {
        setSelectedKey(keys[0]);
        await loadServers(keys[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadServers(key) {
    setLoading(true);
    setError('');
    try {
      const data = await pteroRequest(key.domain, key.client_token, '/client');
      const serverList = data?.attributes?.relationships?.servers?.data || [];
      setServers(serverList);

      const resMap = {};
      for (const s of serverList) {
        try {
          const resData = await pteroRequest(key.domain, key.client_token, `/client/servers/${s.attributes.identifier}/resources`);
          resMap[s.attributes.identifier] = resData?.attributes || {};
        } catch {}
      }
      setResources(resMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getRes(identifier) {
    return resources[identifier]?.resources || {};
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  if (loading && servers.length === 0) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Key Selector */}
      {pteroKeys.length === 0 ? (
        <div className="card-dark p-8 text-center">
          <div className="text-4xl mb-3 opacity-30">🔑</div>
          <h3 className="font-semibold text-white mb-2">Tidak Ada API Key Pterodactyl</h3>
          <p className="text-sm text-gray-500 mb-4">Tambahkan API Key Pterodactyl (PLTA + PLTC + Domain) terlebih dahulu di menu API Keys.</p>
          <a href="/admin/dashboard/api-keys" className="btn-primary inline-block text-sm">Tambah API Key</a>
        </div>
      ) : (
        <>
          {pteroKeys.length > 1 && (
            <div className="flex gap-2">
              {pteroKeys.map(k => (
                <button
                  key={k.id}
                  onClick={() => { setSelectedKey(k); loadServers(k); }}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${selectedKey?.id === k.id ? 'bg-accent-blue text-white' : 'bg-dark-600 text-gray-400 hover:text-white'}`}
                >
                  {k.name || k.domain}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400">
              Gagal memuat server: {error}
            </div>
          )}

          {/* Server Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servers.map(server => {
              const id = server.attributes.identifier;
              const name = server.attributes.name || id;
              const res = getRes(id);
              const cpu = res.cpu_absolute || 0;
              const ramUsed = res.memory_bytes || 0;
              const ramTotal = (res.memory_alloc || 0) * 1024 * 1024;
              const diskUsed = res.disk_bytes || 0;
              const diskTotal = (res.disk_alloc || 0) * 1024 * 1024;
              const ramPercent = ramTotal > 0 ? ((ramUsed / ramTotal) * 100).toFixed(0) : 0;
              const diskPercent = diskTotal > 0 ? ((diskUsed / diskTotal) * 100).toFixed(0) : 0;
              const status = server.attributes.status || 'offline';
              const isOnline = status === 'running' || status === 'online';

              return (
                <div key={id} className="card-dark p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-white">{name}</h4>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{id}</p>
                    </div>
                    <span className={isOnline ? 'server-online text-xs font-medium' : 'server-offline text-xs font-medium'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  {/* Resource Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>CPU</span>
                        <span className="font-mono">{cpu.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-dark-500 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(cpu, 100)}%`,
                            backgroundColor: cpu > 80 ? '#ef4444' : cpu > 50 ? '#f59e0b' : '#3b82f6',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>RAM</span>
                        <span className="font-mono">{formatBytes(ramUsed)} / {formatBytes(ramTotal)} ({ramPercent}%)</span>
                      </div>
                      <div className="h-2 bg-dark-500 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(ramPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Disk</span>
                        <span className="font-mono">{formatBytes(diskUsed)} / {formatBytes(diskTotal)} ({diskPercent}%)</span>
                      </div>
                      <div className="h-2 bg-dark-500 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(diskPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-3 border-t border-dark-400/20 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>Node: {server.attributes?.relationships?.node?.attributes?.name || '-'}</div>
                    <div>Alloc: {res.memory_alloc || 0} MB</div>
                    <div>Disk Alloc: {res.disk_alloc || 0} MB</div>
                    <div>Swap: {res.swap_bytes ? formatBytes(res.swap_bytes) : '0 B'}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {servers.length === 0 && !error && (
            <div className="card-dark p-8 text-center">
              <div className="text-4xl mb-3 opacity-30">🖥️</div>
              <p className="text-sm text-gray-500">Tidak ada server ditemukan di panel ini</p>
            </div>
          )}
        </>
      )}
    </div>
  );
                                                                                                      }
