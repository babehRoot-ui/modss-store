'use client';

import { useState } from 'react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');

      document.cookie = `admin_token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
      window.location.href = '/admin/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 bg-grid-pattern">
      <div className="glow-blob w-80 h-80 bg-accent-blue top-1/4 left-1/4 fixed" />
      <div className="glow-blob w-64 h-64 bg-accent-purple bottom-1/4 right-1/4 fixed" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center font-bold text-2xl mx-auto mb-4">
            B
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">BABEH DIGITAL STORE</p>
        </div>

        <div className="card-dark p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
              <input
                type="text"
                className="input-dark"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                className="input-dark"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-center flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5 border-2 border-white/20 border-t-white" />
                  Login...
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          <a href="/" className="hover:text-gray-400 transition-colors">Kembali ke Toko</a>
        </p>
      </div>
    </div>
  );
}
