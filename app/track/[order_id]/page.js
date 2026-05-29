'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { formatRupiah, getStatusColor, getStatusLabel, getCategoryInfo } from '@/lib/utils';

export default function TrackPage() {
  const params = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchId, setSearchId] = useState('');
  const [manualSearch, setManualSearch] = useState(false);

  useEffect(() => {
    if (params.order_id && params.order_id !== 'undefined') {
      fetchOrder(params.order_id);
    } else {
      setManualSearch(true);
      setLoading(false);
    }
  }, [params.order_id]);

  const fetchOrder = async (id) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order tidak ditemukan');
      setOrder(data.order);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) fetchOrder(searchId.trim());
  };

  return (
    <div className="min-h-screen flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Lacak Order</h1>
          <p className="text-gray-400 text-sm">Masukkan Order ID untuk melihat status pesanan</p>
        </div>

        <form onSubmit={handleSearch} className="glass-card p-4 mb-6 flex gap-3">
          <input type="text" value={searchId} onChange={e => setSearchId(e.target.value)} className="input-field flex-1" placeholder="BDS-XXXXXX-XXXX" />
          <button type="submit" className="btn-primary px-6">Cari</button>
        </form>

        {loading && <div className="text-center py-12 text-gray-400">Memuat...</div>}
        {error && <div className="glass-card p-6 text-center text-red-400">{error}</div>}
        {order && (
          <div className="glass-card p-6 animate-slide-up">
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-xs text-gray-400">Order ID</p>
                <p className="font-mono text-accent text-sm">{order.order_id}</p>
              </div>
              <span className={`badge border ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Produk</span><span className="text-white font-medium">{order.product_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Harga</span><span className="text-accent font-bold">{formatRupiah(order.product_price)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Nama</span><span className="text-white">{order.customer_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">WhatsApp</span><span className="text-white">{order.customer_phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Tanggal</span><span className="text-white">{new Date(order.created_at).toLocaleString('id-ID')}</span></div>
              {order.paid_at && <div className="flex justify-between"><span className="text-gray-400">Dibayar</span><span className="text-white">{new Date(order.paid_at).toLocaleString('id-ID')}</span></div>}
            </div>
            {order.status === 'delivered' && order.delivery_data && (
              <div className="mt-5 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-green-400 font-semibold text-sm mb-2">Detail Pengiriman:</p>
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{JSON.stringify(order.delivery_data, null, 2)}</pre>
              </div>
            )}
            {order.status === 'pending' && (
              <p className="text-yellow-400 text-xs mt-4 text-center">Menunggu pembayaran. QRIS akan expired dalam 15 menit.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
          }
