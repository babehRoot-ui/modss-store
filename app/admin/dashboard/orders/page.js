'use client';

import { useState, useEffect } from 'react';
import { getAllOrders, updateOrder } from '@/lib/supabase';
import { formatRupiah, formatDate, getStatusColor } from '@/lib/utils';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(orderId, newStatus) {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'paid') updates.paid_at = new Date().toISOString();
      await updateOrder(orderId, updates);
      loadOrders();
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (search && !o.order_id.toLowerCase().includes(search.toLowerCase()) && !o.product_name.toLowerCase().includes(search.toLowerCase()) && !o.customer_phone.includes(search)) return false;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'paid', 'delivered', 'failed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-accent-blue text-white' : 'bg-dark-600 text-gray-400 hover:text-white'}`}
            >
              {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && (
                <span className="ml-1 text-[10px] opacity-70">({orders.filter(o => o.status === s).length})</span>
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Cari order ID / produk / WA..."
          className="input-dark text-sm w-full sm:w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card-dark overflow-hidden">
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
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td className="font-mono text-xs">{order.order_id}</td>
                  <td className="max-w-[150px] truncate">{order.product_name}</td>
                  <td>
                    <div>
                      <p className="text-xs">{order.customer_phone}</p>
                      {order.customer_name && <p className="text-[10px] text-gray-500">{order.customer_name}</p>}
                    </div>
                  </td>
                  <td className="font-medium">{formatRupiah(order.product_price)}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={e => handleUpdateStatus(order.order_id, e.target.value)}
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border bg-transparent cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      <option value="pending" className="bg-dark-800">Pending</option>
                      <option value="paid" className="bg-dark-800">Paid</option>
                      <option value="delivered" className="bg-dark-800">Delivered</option>
                      <option value="failed" className="bg-dark-800">Failed</option>
                    </select>
                  </td>
                  <td className="text-xs text-gray-500">{formatDate(order.created_at)}</td>
                  <td>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 rounded-lg bg-dark-500 text-gray-400 hover:text-white hover:bg-dark-400 transition-all"
                      title="Detail"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-500">Tidak ada order ditemukan</div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-dark-400/30 flex items-center justify-between">
              <h3 className="font-bold">Detail Order</h3>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center text-gray-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500 block text-xs">Order ID</span><span className="font-mono">{selectedOrder.order_id}</span></div>
                <div><span className="text-gray-500 block text-xs">Status</span><span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status.toUpperCase()}</span></div>
                <div><span className="text-gray-500 block text-xs">Produk</span><span>{selectedOrder.product_name}</span></div>
                <div><span className="text-gray-500 block text-xs">Harga</span><span className="font-medium">{formatRupiah(selectedOrder.product_price)}</span></div>
                <div><span className="text-gray-500 block text-xs">WhatsApp</span><span>{selectedOrder.customer_phone}</span></div>
                <div><span className="text-gray-500 block text-xs">Nama</span><span>{selectedOrder.customer_name || '-'}</span></div>
                <div><span className="text-gray-500 block text-xs">Email</span><span>{selectedOrder.customer_email || '-'}</span></div>
                <div><span className="text-gray-500 block text-xs">Dibayar</span><span>{selectedOrder.paid_at ? formatDate(selectedOrder.paid_at) : '-'}</span></div>
                <div><span className="text-gray-500 block text-xs">Dibuat</span><span>{formatDate(selectedOrder.created_at)}</span></div>
              </div>
              {selectedOrder.delivery_data && (
                <div className="mt-3 p-3 bg-dark-800 rounded-lg">
                  <p className="text-xs font-medium text-gray-400 mb-2">Delivery Data:</p>
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{JSON.stringify(selectedOrder.delivery_data, null, 2)}</pre>
                </div>
              )}
              {selectedOrder.payment_qr && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500 mb-2">QRIS Payment</p>
                  <div className="qr-container inline-block">
                    <img src={selectedOrder.payment_qr} alt="QR" className="w-40 h-40" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
                      }
