'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getActiveProducts, getBanners } from '@/lib/supabase';
import { formatRupiah, getCategoryLabel, getCategoryColor } from '@/lib/utils';

function Fireflies({ count = 30, active = false }) {
  if (!active) return null;

  const flies = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
      glowDuration: 2 + Math.random() * 3,
      colorClass: ['yellow', 'blue', 'cyan', 'purple', 'green'][Math.floor(Math.random() * 5)],
    }))
  ).current;

  return (
    <div className="firefly-container">
      {flies.map(f => (
        <div
          key={f.id}
          className={`firefly ${f.colorClass}`}
          style={{
            left: `${f.left}%`,
            top: '-10px',
            width: `${f.size}px`,
            height: `${f.size}px`,
            animationDuration: `${f.duration}s, ${f.glowDuration}s`,
            animationDelay: `${f.delay}s, ${f.delay * 0.7}s`,
          }}
        />
      ))}
    </div>
  );
}

function FreezeButton({ children, className = '', onClick, ...props }) {
  const ref = useRef(null);

  function handleClick(e) {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--freeze-x', `${x}%`);
    btn.style.setProperty('--freeze-y', `${y}%`);
    btn.classList.remove('freezing');
    void btn.offsetWidth;
    btn.classList.add('freezing');
    setTimeout(() => btn.classList.remove('freezing'), 600);
    if (onClick) onClick(e);
  }

  return (
    <button ref={ref} className={`${className}`} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

function FreezeLink({ children, className = '', href, ...props }) {
  const ref = useRef(null);

  function handleClick(e) {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--freeze-x', `${x}%`);
    btn.style.setProperty('--freeze-y', `${y}%`);
    btn.classList.remove('freezing');
    void btn.offsetWidth;
    btn.classList.add('freezing');
    setTimeout(() => btn.classList.remove('freezing'), 600);
  }

  return (
    <a ref={ref} className={`${className}`} href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

function Marquee({ texts, speed = 25, reverse = false, slow = false, className = '' }) {
  const doubled = [...texts, ...texts];
  return (
    <div className={`marquee-container ${reverse ? 'marquee-reverse' : ''} ${slow ? 'marquee-slow' : ''} ${className}`}>
      <div className="marquee-content" style={slow ? { animationDuration: `${speed * 1.6}s` } : { animationDuration: `${speed}s` }}>
        {doubled.map((text, i) => (
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
  );
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ phone: '', name: '', email: '' });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [filterCategory, setFilterCategory] = useState('all');

  const productsRef = useReveal();

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

  function scrollToProducts() {
    setShowProducts(true);
    setTimeout(() => {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
  ];

  const marqueeTexts2 = [
    'TERPERCAYA',
    'HARGA TERMURAH',
    'PROSES OTOMATIS',
    'LAYANAN 24 JAM',
    'PRODUK BERKUALITAS',
    'GARANSI UANG KEMBALI',
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      <Fireflies count={35} active={showProducts} />

      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />
      <div className="glow-blob w-96 h-96 bg-accent-blue top-0 -left-48 fixed" />
      <div className="glow-blob w-80 h-80 bg-accent-purple top-1/3 -right-40 fixed" />
      <div className="glow-blob w-64 h-64 bg-accent-cyan bottom-0 left-1/3 fixed" />

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-dark-400/30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center font-bold text-lg shadow-lg shadow-accent-blue/20">
              B
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">BABEH STORE</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Digital Marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FreezeLink href="/track" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-dark-600 btn-secondary !border-0 !px-3 !py-1.5 !text-sm">
              Cek Order
            </FreezeLink>
            <FreezeLink href="/admin/login" className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-dark-600 btn-secondary !border-0 !px-2 !py-1.5 !text-xs !text-gray-600">
              Admin
            </FreezeLink>
          </div>
        </div>
        <Marquee texts={marqueeTexts} speed={20} className="bg-gradient-to-r from-accent-blue/10 via-accent-cyan/10 to-accent-purple/10 border-y border-dark-400/20 py-1.5" />
      </header>

      <main className="relative z-10">

        {/* ====== LANDING HERO ====== */}
        <section className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="orbit-ring w-[300px] h-[300px]" />
            <div className="orbit-ring w-[450px] h-[450px]" />
            <div className="orbit-ring w-[600px] h-[600px]" />
            <div className="orbit-dot" style={{ '--orbit-r': '150px' }} />
            <div className="orbit-dot" style={{ '--orbit-r': '225px', animationDelay: '-2s', background: '#8b5cf6', boxShadow: '0 0 10px rgba(139,92,246,0.8)' }} />
            <div className="orbit-dot" style={{ '--orbit-r': '300px', animationDelay: '-4s', background: '#06b6d4', boxShadow: '0 0 10px rgba(6,182,212,0.8)' }} />
          </div>

          <div className="text-center relative z-10 hero-float">
            <div className="inline-flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 rounded-full px-5 py-2 mb-8 landing-badge-glow animate-fade-in">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
              </span>
              <span className="text-sm font-medium text-accent-blue">Sistem Auto-Order Aktif 24/7</span>
            </div>

            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.1] tracking-tight">
              <span className="block text-white">Selamat</span>
              <span className="block landing-gradient-text">Datang di</span>
              <span className="block text-white mt-1">Toko Kami</span>
            </h2>

            <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto mb-4 leading-relaxed">
              Pterodactyl Panel, Script Digital, dan VPS DigitalOcean dengan pembayaran QRIS. Produk langsung terkirim otomatis.
            </p>

            <div className="max-w-md mx-auto mb-10 opacity-50">
              <Marquee texts={marqueeTexts2} speed={15} reverse className="!py-0" />
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <FreezeButton
                onClick={scrollToProducts}
                className="btn-primary !px-8 !py-4 !text-lg !rounded-2xl inline-flex items-center gap-3 shadow-2xl shadow-accent-blue/30"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                Lihat Produk
              </FreezeButton>
              <FreezeLink
                href="/track"
                className="btn-secondary !px-8 !py-4 !text-lg !rounded-2xl inline-flex items-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Cek Order
              </FreezeLink>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-indicator">
            <span className="text-[10px] text-gray-600 uppercase tracking-[0.3em]">Scroll</span>
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
        </section>

        {/* ====== PRODUCTS AREA (muncul setelah klik "Lihat Produk") ====== */}
        {showProducts && (
          <div className="products-enter">
            <div className="py-2 bg-gradient-to-r from-transparent via-accent-blue/5 to-transparent border-y border-dark-400/10">
              <Marquee texts={['MURAH', 'CEPAT', 'AMAN', 'TERPERCAYA', 'OTOMATIS', '24/7']} speed={12} className="!py-0" />
            </div>

            {banners.length > 0 && (
              <section className="max-w-5xl mx-auto px-4 py-10">
                <div className="relative rounded-2xl overflow-hidden border border-dark-400/30 bg-dark-700 aspect-[21/9] banner-shine">
                  {banners.map((banner, i) => (
                    <div
                      key={banner.id}
                      className={`absolute inset-0 transition-all duration-700 ${i === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                    >
                      {banner.image_url ? (
                        <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white/50">{banner.title || 'Banner'}</span>
                        </div>
                      )}
                      {banner.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                          <h3 className="text-xl font-bold text-white">{banner.title}</h3>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="absolute bottom-3 right-4 flex gap-1.5">
                    {banners.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentBanner(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentBanner ? 'bg-white w-6 shadow-lg shadow-white/30' : 'bg-white/40 hover:bg-white/60'}`}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="max-w-5xl mx-auto px-4 pb-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Produk Tersedia', value: products.length + '+', icon: '📦', color: 'from-blue-500/10 to-blue-500/5 border-blue-500/20' },
                  { label: 'Auto Delivery', value: '24/7', icon: '⚡', color: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20' },
                  { label: 'Metode Bayar', value: 'QRIS', icon: '💳', color: 'from-green-500/10 to-green-500/5 border-green-500/20' },
                  { label: 'Proses Order', value: '< 1 Menit', icon: '🚀', color: 'from-purple-500/10 to-purple-500/5 border-purple-500/20' },
                ].map((stat, i) => (
                  <div key={i} className={`stat-card text-center bg-gradient-to-br ${stat.color}`}>
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </section>

            <div className="py-2 bg-gradient-to-r from-transparent via-accent-purple/5 to-transparent border-y border-dark-400/10 mb-10">
              <Marquee texts={['PANEL PTERODACTYL', 'SCRIPT DIGITAL', 'VPS DIGITALOCEAN', 'MURAH', 'CEPAT', 'AMAN']} speed={18} reverse slow className="!py-0" />
            </div>

            <section id="products-section" ref={productsRef} className="max-w-7xl mx-auto px-4 pb-20 reveal-section">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-accent-purple/10 border border-accent-purple/20 rounded-full px-4 py-1.5 mb-4">
                  <span className="text-xs text-accent-purple font-medium">Katalog Produk</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-3">Semua Produk</h3>
                <p className="text-gray-500 max-w-md mx-auto">Pilih produk digital yang kamu butuhkan, bayar via QRIS, langsung terkirim otomatis</p>
              </div>

              <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
                {[
                  { key: 'all', label: 'Semua', icon: '🌟' },
                  { key: 'panel', label: 'Pterodactyl Panel', icon: '🖥️' },
                  { key: 'script', label: 'Script Digital', icon: '🧩' },
                  { key: 'vps', label: 'VPS DigitalOcean', icon: '🌐' },
                ].map(f => (
                  <FreezeButton
                    key={f.key}
                    onClick={() => setFilterCategory(f.key)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      filterCategory === f.key
                        ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/30 filter-active'
                        : 'bg-dark-600/80 text-gray-400 hover:bg-dark-500 hover:text-white border border-dark-400/30'
                    }`}
                  >
                    <span className="mr-1.5">{f.icon}</span>
                    {f.label}
                  </FreezeButton>
                ))}
              </div>

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
                  {filteredProducts.map((product, idx) => (
                    <div
                      key={product.id}
                      className="product-card-glow card-dark overflow-hidden group cursor-pointer"
                      onClick={() => openCheckout(product)}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="relative aspect-video bg-dark-800 overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(product.category)} flex items-center justify-center`}>
                            <span className="text-4xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                              {product.category === 'panel' ? '🖥️' : product.category === 'script' ? '📄' : '🌐'}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 hero-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
                        <div className="absolute top-3 right-3">
                          <span className="badge bg-black/60 text-white/80 backdrop-blur-sm border-0 text-[10px]">
                            {getCategoryLabel(product.category)}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-lg border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            Klik untuk Beli
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h4 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-accent-blue transition-colors duration-300">
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
                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Harga</p>
                            <p className="text-lg font-bold text-gradient">{formatRupiah(product.price)}</p>
                          </div>
                          <FreezeButton
                            className="btn-primary !text-xs !px-3 !py-1.5"
                            onClick={(e) => { e.stopPropagation(); openCheckout(product); }}
                          >
                            Beli Sekarang
                          </FreezeButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="py-2 bg-gradient-to-r from-transparent via-accent-cyan/5 to-transparent border-y border-dark-400/10">
              <Marquee texts={['TERIMA KASIH', 'TELAH BERBELANJA', 'DI BABEH DIGITAL STORE', 'KUNJUNGI TERUS', 'PRODUK BARU SETIAP HARI']} speed={16} className="!py-0" />
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-dark-400/30 bg-dark-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center font-bold text-sm">B</div>
              <span className="font-semibold text-sm">BABEH DIGITAL STORE</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <FreezeLink href="/track" className="hover:text-white transition-colors">Cek Order</FreezeLink>
              <FreezeLink href="https://wa.me/6285137574436" target="_blank" rel="noopener" className="hover:text-white transition-colors">Kontak</FreezeLink>
              <FreezeLink href="/admin/login" className="hover:text-white transition-colors">Admin</FreezeLink>
            </div>
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Babeh Digital Store</p>
          </div>
        </div>
      </footer>

      {/* CHECKOUT MODAL */}
      {showCheckout && selectedProduct && (
        <div className="modal-overlay" onClick={closeCheckout}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-dark-400/30 flex items-center justify-between">
              <h3 className="font-bold text-lg">Checkout</h3>
              <FreezeButton
                onClick={closeCheckout}
                className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-400 transition-all !p-0 !w-8 !h-8 !rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </FreezeButton>
            </div>

            <div className="p-5 border-b border-dark-400/20">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-dark-600 flex-shrink-0">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(selectedProduct.category)} flex items-center justify-center text-2xl opacity-50`}>
                      {selectedProduct.category === 'panel' ? '🖥️' : selectedProduct.category === 'script' ? '📄' : '🌐'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate">{selectedProduct.name}</h4>
                  <span className="inline-block text-[10px] text-gray-400 bg-dark-500 px-2 py-0.5 rounded mt-1">
                    {getCategoryLabel(selectedProduct.category)}
                  </span>
                  {selectedProduct.type && (
                    <span className="inline-block text-[10px] text-gray-400 bg-dark-500 px-2 py-0.5 rounded mt-1 ml-1">
                      {selectedProduct.type}
                    </span>
                  )}
                  <p className="text-xl font-bold text-gradient mt-2">{formatRupiah(selectedProduct.price)}</p>
                </div>
              </div>
            </div>

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
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 animate-slide-up">
                  {checkoutError}
                </div>
              )}

              <FreezeButton
                type="submit"
                disabled={checkoutLoading}
                className="btn-primary w-full !py-3.5 text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed !text-base"
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
              </FreezeButton>

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
