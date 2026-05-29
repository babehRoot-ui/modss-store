'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/dashboard/products', label: 'Kelola Produk', icon: '📦' },
  { href: '/admin/dashboard/banners', label: 'Kelola Banner', icon: '🖼️' },
  { href: '/admin/dashboard/orders', label: 'Kelola Order', icon: '🧾' },
  { href: '/admin/dashboard/api-keys', label: 'API Keys', icon: '🔑' },
  { href: '/admin/dashboard/servers', label: 'Kelola Server', icon: '🖥️' },
  { href: '/admin/dashboard/settings', label: 'Pengaturan', icon: '⚙️' }
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeName, setStoreName] = useState('BABEH DIGITAL STORE');

  useEffect(() => {
    fetch('/api/admin/api-keys').then(r => r.json()).catch(() => {});
  }, []);

  const handleLogout = () => {
    document.cookie = 'admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-white/5 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-cyan-500 flex items-center justify-center font-black text-dark-950 text-sm">BD</div>
            <span className="font-bold text-sm text-white truncate">{storeName}</span>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map(item => (
            <a key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`admin-sidebar-link ${pathname === item.href ? 'active' : ''}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/5">
          <button onClick={handleLogout} className="admin-sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-400/5">🚪 Logout</button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-h-screen">
        <header className="sticky top-0 z-30 bg-dark-950/80 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white text-xl">☰</button>
          <h2 className="text-sm font-semibold text-white">{menuItems.find(m => m.href === pathname)?.label || 'Dashboard'}</h2>
          <a href="/" target="_blank" className="text-xs text-gray-400 hover:text-accent transition">Lihat Toko →</a>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
