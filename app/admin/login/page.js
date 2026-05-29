'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) { router.push('/admin/dashboard'); }
      else { const data = await res.json(); setError(data.error || 'Login gagal'); }
    } catch { setError('Terjadi kesalahan'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-sm p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-cyan-500 flex items-center justify-center font-black text-dark-950 text-xl mx-auto mb-4">BD</div>
          <h1 className="text-xl font-bold text-white">Admin Login</h1>
          <p className="text-gray-400 text-xs mt-1">BABEH DIGITAL STORE</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" required />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg p-2.5">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">{loading ? 'Memproses...' : 'Masuk'}</button>
        </form>
      </div>
    </div>
  );
}
