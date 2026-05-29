'use client';

import { useState, useEffect } from 'react';
import { formatRupiah, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const updateStatus = async (orderId, newStatus) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-2">
        {['all','pending','paid','delivered','failed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition ${filter === s ? 'border-accent/30 bg-accent/10 text-accent' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {s === 'all' ? 'Semua' : getStatusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-500">Tidak ada order.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <div key={o.id} className="glass-card p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-accent text-xs">{o.order_id}</span>
                    <span className={`badge border ${getStatusColor(o.status)}`}>{getStatusLabel(o.status)}</span>
                  </div>
                  <p className="text-white text-sm font-medium mt-1">{o.product_name}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>{formatRupiah(o.product_price)}</span>
                    <span>{o.customer_name || '-'}</span>
                    <span>{o.customer_phone}</span>
                    <span>{new Date(o.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  {o.delivery_data && (
                    <details className="mt-2">
                      <summary className="text-xs text-accent cursor-pointer">Lihat Data Pengiriman</summary>
                      <pre className="text-xs text-gray-400 mt-1 p-2 bg-dark-900 rounded-lg overflow-x-auto font-mono">{JSON.stringify(o.delivery_data, null, 2)}</pre>
                    </details>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {o.status === 'pending' && <button onClick={() => updateStatus(o.order_id, 'paid')} className="btn-secondary text-xs py-1.5 px-3">Tandai Paid</button>}
                  {o.status === 'paid' && <button onClick={() => updateStatus(o.order_id, 'delivered')} className="btn-secondary text-xs py-1.5 px-3">Tandai Delivered</button>}
                  <button onClick={() => updateStatus(o.order_id, 'failed')} className="btn-danger text-xs py-1.5 px-3">Gagal</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
