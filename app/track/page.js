'use client';

import { useState } from 'react';

export default function TrackPage() {
  const [searchId, setSearchId] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    if (searchId.trim()) {
      window.location.href = `/track/${searchId.trim()}`;
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 bg-grid-pattern flex items-center justify-center p-4">
      <div className="glow-blob w-80 h-80 bg-accent-blue top-1/4 left-1/4 fixed" />
      <div className="glow-blob w-64 h-64 bg-accent-purple bottom-1/4 right-1/4 fixed" />

      <div className="relative z-10 w-full max-w-md animate-fade-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Cek Status Order</h1>
        <p className="text-gray-500 text-sm mb-8">Masukkan Order ID untuk melihat status pesanan kamu</p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="BD-xxxxxx-xxxxxx"
            className="input-dark flex-1 text-center font-mono"
            value={searchId}
            onChange={e => setSearchId(e.target.value.toUpperCase())}
          />
          <button type="submit" className="btn-primary">Cari</button>
        </form>

        <a href="/" className="inline-block mt-6 text-sm text-gray-500 hover:text-white transition-colors">
          Kembali ke Toko
        </a>
      </div>
    </div>
  );
}
