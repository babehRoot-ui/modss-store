'use client';

import { useState, useEffect } from 'react';
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prodRes, ordRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/orders')
        ]);
        const prodData = await prodRes.json();
        const ordData = await ordRes.json();
        const orders = ordData.orders || [];
        const products = prodData.products || [];
        setStats({
          products: products.length,
          orders: orders.length,
          revenue: orders.filter(o => o.status === 'paid' || o.status === 'delivered').reduce((s, o) => s + o.product_price, 0),
          pending: orders.filter(o => o.status === 'pending').length
        });
        setRecentOrders(orders.slice(0, 5));
      } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total Produk', value: stats.products, icon: '📦', color: 'from-cyan-600 to-blue-600' },
    { label: 'Total Order', value: stats.orders, icon: '🧾', color: 'from-purple-600 to-pink-600' },
    { label: 'Pendapatan', value: formatRupiah(stats.revenue), icon: '💰', color: 'from-green-600 to-emerald-600' },
    { label: 'Pending', value: stats.pending, icon: '⏳', color: 'from-yellow-600 to-orange-600' }
  ];

  if (loading) return <div className="text-center py-20 text-gray-400">Memuat dashboard...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stat Cards - Mirip Pterodactyl dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="glass-card p-5 hover:glow-border transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} opacity-20`} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Server Status Mock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Server Status</h3>
          <div className="space-y-3">
            {['NODE-01', 'NODE-02', 'NODE-03', 'NODE-04'].map((name, i) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-dark-900/60 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm text-white font-medium">{name}</span>
                </div>
                <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-400/20">Online</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Usage */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Resource Usage</h3>
          <div className="space-y-4">
            {[
              { label: 'CPU', value: 12, color: 'bg-cyan-500' },
              { label: 'RAM', value: 34, color: 'bg-purple-500' },
              { label: 'Disk', value: 28, color: 'bg-accent' }
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">{r.label}</span>
                  <span className="text-white font-medium">{r.value}%</span>
                </div>
                <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full transition-all duration-1000`} style={{ width: `${r.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Order Terbaru</h3>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Belum ada order</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-400 text-xs border-b border-white/5">
                <th className="pb-3 pr-4">Order ID</th><th className="pb-3 pr-4">Produk</th><th className="pb-3 pr-4">Harga</th><th className="pb-3">Status</th>
              </tr></thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 font-mono text-accent text-xs">{o.order_id}</td>
                    <td className="py-3 pr-4 text-white truncate max-w-[200px]">{o.product_name}</td>
                    <td className="py-3 pr-4 text-white">{formatRupiah(o.product_price)}</td>
                    <td className="py-3"><span className={`badge border ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span></td>
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
