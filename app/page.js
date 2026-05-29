'use client';

import { useState, useEffect } from 'react';
import { getActiveProducts, getBanners } from '@/lib/supabase';
import { formatRupiah, getCategoryLabel, getCategoryColor } from '@/lib/utils';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ phone: '', name: '', email: '' });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  async function loadData() {
    try {
      const [prods, bans] = await Promise.all([getActiveProducts(), getBanners()]);
      setProducts(prods);
      setBanners(bans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCheckout(product) {
    setSelectedProduct(product);
    setCheckoutForm({ phone: '', name: '', email: '' });
    setCheckoutError('');
    setShowCheckout(true);
  }

  function closeCheckout() {
    setShowCheckout(false);
    setSelectedProduct(null);
  }

  async function handleCheckout(e) {
    e.preventDefault();
    if (!checkoutForm.phone || checkoutForm.phone.length < 10) {
      setCheckoutError('Nomor WhatsApp harus valid (min 10 digit)');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          customer_phone: checkoutForm.phone,
          customer_name: checkoutForm.name,
          customer_email: checkoutForm.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat order');

      window.location.href = `/track/${data.order_id}`;
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  }

  const filteredProducts = filterCategory === 'all'
    ? products
    : products.filter(p => p.category === filterCategory);

  const marqueeTexts = [
    'BABEH DIGITAL STORE',
    'Pterodactyl Panel Murah',
    'Script & File Digital Terlengkap',
    'VPS DigitalOcean Terpercaya',
    'Auto-Order Instan 24/7',
    'Pembayaran QRIS Mudah',
    'BABEH DIGITAL STORE',
    'Pterodactyl Panel Murah',
    'Script & File Digital Terlengkap',
    'VPS DigitalOcean Terpercaya',
    'Auto-Order Instan 24/7',
    'Pembayaran QRIS Mudah',
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />
      <div className="glow-blob w-96 h-96 bg-accent-blue top-0 -left-48 fixed" />
      <div className="glow-blob w-80 h-80 bg-accent-purple top-1/3 -right-40 fixed" />
      <div className="glow-blob w-64 h-64 bg-accent-cyan bottom-0 left-1/3 fixed" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-dark-400/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center font-bold text-lg">
              B
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">BABEH STORE</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Digital Marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/track" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-dark-600">
              Cek Order
            </a>
            <a href="/admin/login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Admin
            </a>
          </div>
        </div>

        {/* Marquee */}
        <div className="bg-gradient-to-r from-accent-blue/10 via-accent-cyan/10 to-accent-purple/10 border-y border-dark-400/20 marquee-container py-1.5">
          <div className="marquee-content">
            {marqueeTexts.map((text, i) => (
              <span key={i} className="inline-block mx-6 text-xs font-medium text-gray-400">
                {i % 2 === 0 ? (
                  <span className="text-accent-cyan">&#9670;</span>
                ) : (
                  <span className="text-accent-purple">&#9670;</span>
                )}{' '}
                {text}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-accent-blue">Sistem Auto-Order Aktif 24/7</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
              Beli <span className="text-gradient">Digital Produk</span>
              <br />Mudah & Instan
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              Pterodactyl Panel, Script Digital, dan VPS DigitalOcean dengan pembayaran QRIS. Produk langsung terkirim otomatis setelah bayar.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a href="#products" className="btn-primary inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                Lihat Produk
              </a>
              <a href="/track" className="btn-secondary inline-flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Cek Status Order
              </a>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Produk Tersedia', value: products.length + '+', icon: '📦' },
              { label: 'Auto Delivery', value: '24/7', icon: '⚡' },
              { label: 'Metode Bayar', value: 'QRIS', icon: '💳' },
              { label: 'Proses Order', value: '< 1 Menit', icon: '🚀' },
            ].map((stat, i) => (
              <div key={i} className="stat-card text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Banner Slider */}
        {banners.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 pb-12">
            <div className="relative rounded-2xl overflow-hidden border border-dark-400/30 bg-dark-700 aspect-[21/9]">
              {banners.map((banner, i) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === currentBanner ? 'opacity-100' : 'opacity-0'}`}
                >
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white/50">{banner.title || 'Banner'}</span>
                    </div>
                  )}
                  {banner.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <h3 className="text-xl font-bold text-white">{banner.title}</h3>
                    </div>
                  )}
                </div>
              ))}
              {/* Dots */}
              <div className="absolute bottom-3 right-4 flex gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentBanner(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentBanner ? 'bg-white w-6' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Products Section */}
        <section id="products" className="max-w-7xl mx-auto px-4 pb-20">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-2">Semua Produk</h3>
            <p className="text-gray-500">Pilih produk digital yang kamu butuhkan</p>
          </div>

          {/* Filter */}
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'panel', label: 'Pterodactyl Panel' },
              { key: 'script', label: 'Script Digital' },
              { key: 'vps', label: 'VPS DigitalOcean' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterCategory(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterCategory === f.key
                    ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/25'
                    : 'bg-dark-600 text-gray-400 hover:bg-dark-500 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="spinner" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4 opacity-30">📦</div>
              <p className="text-gray-500">Belum ada produk tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="product-card-glow card-dark overflow-hidden group cursor-pointer"
                  onClick={() => openCheckout(product)}
                >
                  {/* Image */}
                  <div className="relative aspect-video bg-dark-800 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(product.category)} flex items-center justify-center`}>
                        <span className="text-4xl opacity-50">
                          {product.category === 'panel' ? '🖥️' : product.category === 'script' ? '📄' : '🖥️'}
                        </span>
                      </div>
                    )}
                    {/* Badge */}
                    {product.badge && (
                      <div className="absolute top-3 left-3">
                        <span className={
                          product.badge === 'SALE' ? 'badge-sale' :
                          product.badge === 'HOT' ? 'badge-hot' : 'badge-new'
                        }>
                          {product.badge}
                        </span>
                      </div>
                    )}
                    {/* Category */}
                    <div className="absolute top-3 right-3">
                      <span className="badge bg-black/50 text-white/80 backdrop-blur-sm border-0 text-[10px]">
                        {getCategoryLabel(product.category)}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h4 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-accent-blue transition-colors">
                      {product.name}
                    </h4>
                    {product.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                    )}
                    {product.type && (
                      <span className="inline-block text-[10px] text-gray-400 bg-dark-500 px-2 py-0.5 rounded mb-2">
                        {product.type}
                      </span>
                    )}
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <p className="text-xs text-gray-500">Harga</p>
                        <p className="text-lg font-bold text-gradient">{formatRupiah(product.price)}</p>
                      </div>
                      <button className="btn-primary text-xs px-3 py-1.5">
                        Beli Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-dark-400/30 bg-dark-800/50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center font-bold text-sm">B</div>
                <span className="font-semibold">BABEH DIGITAL STORE</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <a href="/track" className="hover:text-white transition-colors">Cek Order</a>
                <a href="https://wa.me/6285137574436" target="_blank" rel="noopener" className="hover:text-white transition-colors">Kontak</a>
                <a href="/admin/login" className="hover:text-white transition-colors">Admin</a>
              </div>
              <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Babeh Digital Store</p>
            </div>
          </div>
        </footer>
      </main>

      {/* Checkout Modal */}
      {showCheckout && selectedProduct && (
        <div className="modal-overlay" onClick={closeCheckout}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-5 border-b border-dark-400/30 flex items-center justify-between">
              <h3 className="font-bold text-lg">Checkout</h3>
              <button onClick={closeCheckout} className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-400 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Product Summary */}
            <div className="p-5 border-b border-dark-400/20">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-dark-600 flex-shrink-0">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(selectedProduct.category)} flex items-center justify-center text-2xl opacity-50`}>
                      {selectedProduct.category === 'panel' ? '🖥️' : selectedProduct.category === 'script' ? '📄' : '🖥️'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{selectedProduct.name}</h4>
                  <span className="inline-block text-[10px] text-gray-400 bg-dark-500 px-2 py-0.5 rounded mt-1">
                    {getCategoryLabel(selectedProduct.category)}
                  </span>
                  <p className="text-xl font-bold text-gradient mt-2">{formatRupiah(selectedProduct.price)}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCheckout} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nomor WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  className="input-dark"
                  value={checkoutForm.phone}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: 08xxx atau 628xxx</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama (Opsional)</label>
                <input
                  type="text"
                  placeholder="Nama kamu"
                  className="input-dark"
                  value={checkoutForm.name}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="email@contoh.com"
                  className="input-dark"
                  value={checkoutForm.email}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              {checkoutError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                  {checkoutError}
                </div>
              )}

              <button
                type="submit"
                disabled={checkoutLoading}
                className="btn-primary w-full py-3 text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <>
                    <div className="spinner w-5 h-5 border-2 border-white/20 border-t-white" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Bayar Sekarang — {formatRupiah(selectedProduct.price)}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Pembayaran via QRIS (GoPay, OVO, DANA, ShopeePay, dll)
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
    }
