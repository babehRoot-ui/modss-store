'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatRupiah, formatDate, getStatusColor, getCategoryLabel } from '@/lib/utils';
import { useParams } from 'next/navigation';

export default function TrackPage() {
  const params = useParams();
  const orderId = params.order_id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchId, setSearchId] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Order tidak ditemukan');
      }
      const data = await res.json();
      setOrder(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId, fetchOrder]);

  // Polling setiap 3 detik jika status pending/paid
  useEffect(() => {
    if (!order || (order.status !== 'pending' && order.status !== 'paid')) return;
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  function handleSearch(e) {
    e.preventDefault();
    if (searchId.trim()) {
      window.location.href = `/track/${searchId.trim()}`;
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-grid-pattern">
      <div className="glow-blob w-80 h-80 bg-accent-blue -top-40 left-1/4 fixed" />
      <div className="glow-blob w-64 h-64 bg-accent-purple bottom-0 right-1/4 fixed" />

      <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-dark-400/30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Kembali
          </a>
          <h1 className="font-bold">Cek Status Order</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Search Box */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="Masukkan Order ID (BD-xxxxxx-xxxxxx)"
            className="input-dark flex-1"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
          />
          <button type="submit" className="btn-primary">Cari</button>
        </form>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">Order Tidak Ditemukan</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        )}

        {order && !loading && (
          <div className="space-y-5 animate-fade-in">
            {/* Order Header */}
            <div className="card-dark p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Order ID</p>
                  <p className="font-mono font-bold text-lg text-white">{order.order_id}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Produk</p>
                  <p className="text-white font-medium">{order.product_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Harga</p>
                  <p className="text-white font-medium">{formatRupiah(order.product_price)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">WhatsApp</p>
                  <p className="text-white font-medium">{order.customer_phone}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Tanggal</p>
                  <p className="text-white font-medium">{formatDate(order.created_at)}</p>
                </div>
                {order.customer_name && (
                  <div>
                    <p className="text-gray-500 text-xs">Nama</p>
                    <p className="text-white font-medium">{order.customer_name}</p>
                  </div>
                )}
                {order.paid_at && (
                  <div>
                    <p className="text-gray-500 text-xs">Dibayar</p>
                    <p className="text-white font-medium">{formatDate(order.paid_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* QR Payment (jika pending) */}
            {order.status === 'pending' && order.payment_qr && (
              <div className="card-dark p-5 text-center">
                <div className="polling-indicator flex items-center justify-center gap-2 text-yellow-400 text-sm mb-4">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  Menunggu Pembayaran...
                </div>
                <div className="qr-container mx-auto mb-4">
                  <img src={order.payment_qr} alt="QRIS" className="w-56 h-56" />
                </div>
                <p className="text-sm text-gray-400 mb-2">Scan QR di atas untuk bayar</p>
                <p className="text-2xl font-bold text-gradient">{formatRupiah(order.product_price)}</p>
                <p className="text-xs text-gray-500 mt-3">Status akan otomatis update setelah pembayaran berhasil</p>
                {order.payment_link && (
                  <a
                    href={order.payment_link}
                    target="_blank"
                    rel="noopener"
                    className="btn-primary inline-flex items-center gap-2 mt-4 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Buka Halaman Pembayaran
                  </a>
                )}
              </div>
            )}

            {/* Processing */}
            {order.status === 'paid' && (
              <div className="card-dark p-5 text-center">
                <div className="polling-indicator flex items-center justify-center gap-2 text-blue-400 text-sm">
                  <div className="spinner w-4 h-4 border-2 border-blue-400/20 border-t-blue-400" />
                  Sedang Memproses Pengiriman...
                </div>
                <p className="text-xs text-gray-500 mt-2">Produk sedang disiapkan, mohon tunggu sebentar</p>
              </div>
            )}

            {/* Delivered Data */}
            {order.status === 'delivered' && order.delivery_data && (
              <div className="card-dark p-5">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-semibold">Produk Telah Dikirim</span>
                </div>

                <div className="bg-dark-800 rounded-lg p-4 space-y-2 font-mono text-sm">
                  {order.delivery_data.panel_url && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Panel URL:</span>
                        <a href={order.delivery_data.panel_url} target="_blank" rel="noopener" className="text-accent-blue hover:underline">{order.delivery_data.panel_url}</a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Username:</span>
                        <span className="text-white">{order.delivery_data.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Server ID:</span>
                        <span className="text-white">{order.delivery_data.server_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="text-white">{order.delivery_data.email}</span>
                      </div>
                    </>
                  )}
                  {order.delivery_data.ip && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">IP Address:</span>
                        <span className="text-white">{order.delivery_data.ip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Username:</span>
                        <span className="text-white">{order.delivery_data.username || 'root'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Password:</span>
                        <span className="text-white">{order.delivery_data.password}</span>
                      </div>
                      {order.delivery_data.region && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Region:</span>
                          <span className="text-white">{order.delivery_data.region}</span>
                        </div>
                      )}
                    </>
                  )}
                  {order.delivery_data.file_url && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Download:</span>
                      <a href={order.delivery_data.file_url} target="_blank" rel="noopener" className="text-accent-blue hover:underline break-all text-right max-w-[60%]">{order.delivery_data.file_url}</a>
                    </div>
                  )}
                </div>

                {order.delivery_data.wa_link && (
                  <a
                    href={order.delivery_data.wa_link}
                    target="_blank"
                    rel="noopener"
                    className="btn-primary w-full mt-4 text-center inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Lihat Detail di WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* Failed */}
            {order.status === 'failed' && (
              <div className="card-dark p-5 text-center">
                <div className="text-red-400 text-4xl mb-3">✕</div>
                <h3 className="font-semibold text-red-400 mb-2">Order Gagal</h3>
                <p className="text-sm text-gray-500">Silakan hubungi admin untuk informasi lebih lanjut</p>
                <a href={`https://wa.me/6285137574436?text=Halo, order saya ${order.order_id} gagal. Mohon bantuannya.`} target="_blank" rel="noopener" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
                  Hubungi Admin
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
                    }
