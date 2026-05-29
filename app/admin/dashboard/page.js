'use client';

import { useState, useEffect } from 'react';
import { getAllProducts, getAllOrders } from '@/lib/supabase';
import { formatRupiah, getStatusColor } from '@/lib/utils';
import { getApiKeys } from '@/lib/supabase';
import { pteroRequest } from '@/lib/pterodactyl';

export default function DashboardHome() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [servers, setServers] = useState([]);
  const [serverStats, setServerStats] = useState({ servers: 0, users: 0, allocations: 0, backups: 0 });
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState({});

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [products, orders] = await Promise.all([getAllProducts(), getAllOrders()]);
      const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'delivered');
      const revenue = paidOrders.reduce((sum, o) => sum + (o.product_price || 0), 0);
      const pending = orders.filter(o => o.status === 'pending').length;

      setStats({
        products: products.length,
        orders: orders.length,
        revenue,
        pending,
      });
      setRecentOrders(orders.slice(0, 5));

      // Load Pterodactyl servers
      try {
        const pteroKeys = await getApiKeys('pterodactyl');
        if (pteroKeys.length > 0) {
          const key = pteroKeys[0];
          const data = await pteroRequest(key.domain, key.client_token, '/client');
          const serverList = data?.attributes?.relationships?.servers?.data || [];
          setServers(serverList);

          let totalAlloc = 0;
          const resMap = {};
          for (const s of serverList) {
            try {
              const resData = await pteroRequest(key.domain, key.client_token, `/client/servers/${s.attributes.identifier}/resources`);
              resMap[s.attributes.identifier] = resData?.attributes || {};
              totalAlloc += (resData?.attributes?.resources?.memory_alloc || 0);
            } catch {}
          }
          setResources(resMap);
          setServerStats({
            servers: serverList.length,
            users: serverList.length,
            allocations: totalAlloc,
            backups: 0,
          });
        }
      } catch (err) {
        console.log('Tidak bisa load server Pterodactyl:', err.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getCpuUsage(identifier) {
    const r = resources[identifier];
    if (!r || !r.resources) return 0;
    return r.resources.cpu_absolute || 0;
  }

  function getRamUsage(identifier) {
    const r = resources[identifier];
    if (!r || !r.resources) return { used: 0, total: 0 };
    return {
      used: r.resources.memory_bytes || 0,
      total: (r.resources.memory_alloc || 0) * 1024 * 1024,
    };
  }

  function getDiskUsage(identifier) {
    const r = resources[identifier];
    if (!r || !r.resources) return { used: 0, total: 0 };
    return {
      used: r.resources.disk_bytes || 0,
      total: (r.resources.disk_alloc || 0) * 1024 * 1024,
    };
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards - seperti Pterodactyl Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.products}</p>
              <p className="text-xs text-gray-500">Produk</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.orders}</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatRupiah(stats.revenue)}</p>
              <p className="text-xs text-gray-500">Pendapatan</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pterodactyl-like Server Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Stats */}
        <div className="card-dark p-5">
          <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-4">Server Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-800 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-white">{serverStats.servers}</p>
              <p className="text-xs text-gray-500">Servers</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-white">{serverStats.users}</p>
              <p className="text-xs text-gray-500">Users</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-white">{(serverStats.allocations / 1024).toFixed(1)} GB</p>
              <p className="text-xs text-gray-500">Allocations</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-white">{serverStats.backups}</p>
              <p className="text-xs text-gray-500">Backups</p>
            </div>
          </div>
        </div>

        {/* Server Status List */}
        <div className="lg:col-span-2 card-dark p-5">
          <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-4">Server Status</h3>
          {servers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Tidak ada server ditemukan</p>
              <p className="text-xs text-gray-600 mt-1">Tambahkan API Key Pterodactyl di menu API Keys</p>
            </div>
          ) : (
            <div className="space-y-3">
              {servers.map(server => {
                const id = server.attributes.identifier;
                const cpu = getCpuUsage(id);
                const ram = getRamUsage(id);
                const disk = getDiskUsage(id);
                const ramPercent = ram.total > 0 ? ((ram.used / ram.total) * 100).toFixed(0) : 0;
                const diskPercent = disk.total > 0 ? ((disk.used / disk.total) * 100).toFixed(0) : 0;

                return (
                  <div key={id} className="bg-dark-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="server-online text-xs font-medium">
                          {server.attributes.name || id}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">{id}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="flex justify-between text-gray-500 mb-1">
                          <span>CPU</span>
                          <span>{cpu.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-dark-500 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${Math.min(cpu, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-500 mb-1">
                          <span>RAM</span>
                          <span>{ramPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-dark-500 rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${Math.min(ramPercent, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-500 mb-1">
                          <span>Disk</span>
                          <span>{diskPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-dark-500 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${Math.min(diskPercent, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card-dark overflow-hidden">
        <div className="p-5 border-b border-dark-400/30">
          <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">Order Terbaru</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500">Belum ada order</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Produk</th>
                  <th>Customer</th>
                  <th>Harga</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="font-mono text-xs">{order.order_id}</td>
                    <td className="max-w-[150px] truncate">{order.product_name}</td>
                    <td>{order.customer_phone}</td>
                    <td className="font-medium">{formatRupiah(order.product_price)}</td>
                    <td>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
    }
