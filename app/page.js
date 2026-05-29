'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatRupiah, generateOrderId, getCategoryInfo } from '@/lib/utils';

export default function HomePage() {
  const [products, setProducts] = useState({ panel: [], script: [], vps: [] });
  const [banners, setBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [paymentData, setPaymentData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pollInterval, setPollInterval] = useState(null);
  const [ready, setReady] = useState(false);

  const fetchData = useCallback(async () => {
    if (!supabase) {
      setProducts({ panel: [], script: [], vps: [] });
      setBanners([]);
      setReady(true);
      return;
    }
    try {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data: bans } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (prods) {
        setProducts({
          panel: prods.filter(p => p.category === 'panel'),
          script: prods.filter(p => p.category === 'script'),
          vps: prods.filter(p => p.category === 'vps')
        });
      }
      if (bans) setBanners(bans);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner(i => (i + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (!showPayment || !orderData?.order_id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderData.order_id}`);
        const data = await res.json();
        if (data.order?.status === 'delivered') {
          clearInterval(interval);
          setOrderData(data.order);
          setShowPayment(false);
          setCheckoutProduct(null);
          setShowCheckout(false);
          alert('Pembayaran berhasil! Produk sudah dikirim ke WhatsApp kamu.');
        } else if (data.order?.status === 'failed') {
          clearInterval(interval);
          setError('Pembayaran gagal atau expired.');
          setShowPayment(false);
        } else {
          setOrderData(data.order);
        }
      } catch (e) {
        // silent
      }
    }, 3000);
    setPollInterval(interval);
    return () => clearInterval(interval);
  }, [showPayment, orderData?.order_id]);

  const handleBuy = (product) => {
    setCheckoutProduct(product);
    setShowCheckout(true);
    setShowPayment(false);
    setError('');
    setFormData({ name: '', phone: '' });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.length < 10) {
      setError('Nomor WhatsApp harus valid');
      return;
    }
    setLoading(true);
    setError('');
    const orderId = generateOrderId();

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          product_id: checkoutProduct.id,
          product_name: checkoutProduct.name,
          product_price: checkoutProduct.price,
          customer_name: formData.name || 'Customer',
          customer_phone: formData.phone,
          customer_email: ''
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat order');
      setPaymentData(data.payment);
      setOrderData(data.order);
      setShowPayment(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowCheckout(false);
    setShowPayment(false);
    setCheckoutProduct(null);
    setPaymentData(null);
    setOrderData(null);
    setError('');
    if (pollInterval) clearInterval(pollInterval);
  };

  const categories = [
    { key: 'panel', ...getCategoryInfo('panel') },
    { key: 'script', ...getCategoryInfo('script') },
    { key: 'vps', ...getCategoryInfo('vps') }
  ];

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="bg-glow-1" />
      <div className="bg-glow-2" />

      {/* Running Text */}
      <div className="bg-gradient-to-r from-accent/20 via-cyan-500/20 to-accent/20 border-b border-white/5 py-2 overflow-hidden relative z-10">
        <div className="marquee-track animate-marquee">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="inline-flex items-center gap-8 px-4 text-sm text-accent font-medium whitespace-nowrap">
              <span>BABEH DIGITAL STORE</span>
              <span className="text-white/20">✦</span>
              <span>Panel Murah & Berkualitas</span>
              <span className="text-white/20">✦</span>
              <span>Script Terupdate</span>
              <span className="text-white/20">✦</span>
              <span>VPS High Performance</span>
              <span className="text-white/20">✦</span>
              <span>Pengiriman Otomatis 24/7</span>
              <span className="text-white/20">✦</span>
              <span>Payment QRIS Mudah</span>
              <span className="text-white/20">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-cyan-500 flex items-center justify-center font-black text-dark-950 text-sm">
              BD
            </div>
            <span className="font-bold text-lg text-white tracking-tight">BABEH DIGITAL</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/track/" className="btn-secondary text-sm py-2 px-4">Lacak Order</a>
            <a href="/admin/login" className="text-xs text-gray-500 hover:text-gray-300 transition">Admin</a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Banner Slider */}
        {banners.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden mb-12 h-48 sm:h-64 md:h-80">
            {banners.map((b, i) => (
              <div
                key={b.id}
                className={`banner-slide absolute inset-0 ${i === currentBanner ? 'opacity-100' : 'opacity-0'}`}
              >
                <img
                  src={b.image_url}
                  alt={b.title || ''}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/30 to-transparent" />
                {b.title && (
                  <div className="absolute bottom-6 left-6 text-2xl sm:text-3xl font-bold text-white">
                    {b.title}
                  </div>
                )}
              </div>
            ))}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBanner(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i === currentBanner ? 'bg-accent w-8' : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Hero Section */}
        {banners.length === 0 && (
          <div className="relative rounded-2xl overflow-hidden mb-12 p-8 sm:p-12 bg-gradient-to-br from-dark-800 to-dark-900 border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
            <div className="relative">
              <div className="badge badge-sale mb-4 inline-block">GRAND OPENING</div>
              <h1 className="text-3xl sm:text-5xl font-black text-white mb-3 leading-tight">
                Toko Digital
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-cyan-400">
                  Terpercaya
                </span>
              </h1>
              <p className="text-gray-400 max-w-md text-sm sm:text-base">
                Jual panel, script, dan VPS dengan pengiriman otomatis. Bayar pakai QRIS, produk langsung terkirim!
              </p>
            </div>
          </div>
        )}

        {/* Kategori Produk */}
        {categories.map(cat => (
          <section key={cat.key} className="mb-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{cat.icon}</span>
              <h2 className="text-xl font-bold text-white">{cat.label}</h2>
              <div className={`flex-1 h-px bg-gradient-to-r ${cat.color} opacity-20`} />
            </div>
            {products[cat.key].length === 0 ? (
              <div className="glass-card p-8 text-center text-gray-500 text-sm">
                Belum ada produk {cat.label.toLowerCase()}, cek lagi nanti.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products[cat.key].map(p => (
                  <ProductCard key={p.id} product={p} onBuy={handleBuy} />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-8 text-center text-gray-500 text-xs relative z-10">
        <p>&copy; {new Date().getFullYear()} BABEH DIGITAL STORE. All rights reserved.</p>
      </footer>

      {/* Modal Checkout */}
      {showCheckout && checkoutProduct && (
        <div
          className="fixed inset-0 z-[100] modal-overlay flex items-center justify-center p-4 animate-fade-in"
          onClick={closeModal}
        >
          <div className="glass-card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            {!showPayment ? (
              <>
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-lg font-bold text-white">Checkout</h3>
                  <button onClick={closeModal} className="text-gray-500 hover:text-white text-xl leading-none">
                    &times;
                  </button>
                </div>
                <div className="flex gap-4 mb-5 p-3 rounded-xl bg-dark-900/60 border border-white/5">
                  <img
                    src={checkoutProduct.image_url || '/images/default-product.jpg'}
                    alt={checkoutProduct.name}
                    className="w-20 h-20 rounded-lg object-cover bg-dark-700"
                  />
                  <div>
                    <p className="font-semibold text-white text-sm">{checkoutProduct.name}</p>
                    <p className="text-accent font-bold text-lg mt-1">
                      {formatRupiah(checkoutProduct.price)}
                    </p>
                    {checkoutProduct.badge && (
                      <span className={`badge mt-1 inline-block badge-${checkoutProduct.badge.toLowerCase()}`}>
                        {checkoutProduct.badge}
                      </span>
                    )}
                  </div>
                </div>
                <form onSubmit={handlePay} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Nama (opsional)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="Nama kamu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Nomor WhatsApp <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field"
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg p-2.5">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-center disabled:opacity-50"
                  >
                    {loading ? 'Memproses...' : `Bayar ${formatRupiah(checkoutProduct.price)}`}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-lg font-bold text-white">Pembayaran QRIS</h3>
                  <button onClick={closeModal} className="text-gray-500 hover:text-white text-xl leading-none">
                    &times;
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-1">Order ID</p>
                  <p className="font-mono text-accent text-sm mb-4">{orderData?.order_id}</p>
                  {paymentData?.qr_string && (
                    <div className="inline-block p-3 bg-white rounded-2xl mb-4">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(paymentData.qr_string)}&size=220x220&color=000000`}
                        alt="QRIS"
                        className="w-52 h-52"
                      />
                    </div>
                  )}
                  {!paymentData?.qr_string && (
                    <div className="inline-block p-3 bg-dark-900 rounded-2xl mb-4 w-52 h-52 flex items-center justify-center">
                      <p className="text-xs text-gray-500">QR Code tidak tersedia.<br/>Cek status di halaman Lacak Order.</p>
                    </div>
                  )}
                  <p className="font-bold text-white text-xl mb-1">
                    {formatRupiah(checkoutProduct.price)}
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Scan QR di atas pakai aplikasi e-wallet
                  </p>
                  <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm mb-4">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    Menunggu pembayaran...
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay, dll)</p>
                    <p>Scan QR code di atas</p>
                    <p>Pembayaran otomatis dikonfirmasi dalam hitungan detik</p>
                  </div>
                  <a
                    href={`/track/${orderData?.order_id}`}
                    className="inline-block mt-4 text-xs text-accent hover:underline"
                  >
                    Atau lacak order di sini →
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onBuy }) {
  const catInfo = getCategoryInfo(product.category);
  return (
    <div className="product-card glass-card overflow-hidden cursor-pointer group" onClick={() => onBuy(product)}>
      <div className="relative h-44 bg-dark-700 overflow-hidden">
        <img
          src={product.image_url || '/images/default-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
        {product.badge && (
          <span className={`badge badge-${product.badge.toLowerCase()} absolute top-3 left-3`}>
            {product.badge}
          </span>
        )}
        <span className="absolute top-3 right-3 text-xs bg-dark-900/70 backdrop-blur text-gray-300 px-2 py-1 rounded-lg border border-white/10">
          {catInfo.icon} {catInfo.label}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-accent font-bold text-lg">{formatRupiah(product.price)}</span>
          <span className="text-xs text-gray-500 bg-dark-900/50 px-2 py-1 rounded">
            Stok: {product.stock}
          </span>
        </div>
        <button className="btn-primary w-full mt-3 py-2.5 text-sm text-center">Beli Sekarang</button>
      </div>
    </div>
  );
          }
