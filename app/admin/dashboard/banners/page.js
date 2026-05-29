'use client';

import { useState, useEffect } from 'react';
import { getAllBanners, createBanner, deleteBanner } from '@/lib/supabase';

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ image_url: '', title: '', link: '', order_position: '0' });

  useEffect(() => { loadBanners(); }, []);

  async function loadBanners() {
    try {
      const data = await getAllBanners();
      setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await createBanner({
        image_url: form.image_url,
        title: form.title || null,
        link: form.link || null,
        order_position: parseInt(form.order_position) || 0,
        is_active: true,
      });
      setShowForm(false);
      setForm({ image_url: '', title: '', link: '', order_position: '0' });
      loadBanners();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus banner ini?')) return;
    try {
      await deleteBanner(id);
      loadBanners();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{banners.length} banner</p>
        <button onClick={() => { setFormError(''); setShowForm(true); }} className="btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map((banner, idx) => (
          <div key={banner.id} className="card-dark overflow-hidden group">
            <div className="relative aspect-[21/9] bg-dark-800 overflow-hidden">
              {banner.image_url ? (
                <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-accent-blue/20 to-accent-purple/20 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No Image</span>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                  #{idx + 1}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button onClick={() => handleDelete(banner.id)} className="btn-danger text-xs">Hapus</button>
              </div>
            </div>
            <div className="p-3">
              <p className="font-medium text-sm text-white truncate">{banner.title || 'Tanpa Judul'}</p>
              {banner.link && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{banner.link}</p>
              )}
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="text-4xl mb-3 opacity-30">🖼️</div>
            <p className="text-sm text-gray-500">Belum ada banner</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-dark-400/30 flex items-center justify-between">
              <h3 className="font-bold">Tambah Banner</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center text-gray-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Image URL *</label>
                <input type="url" className="input-dark" placeholder="https://..." value={form.image_url} onChange={e => setForm(p => ({...p, image_url: e.target.value}))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Judul</label>
                <input type="text" className="input-dark" placeholder="Judul banner" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Link (Opsional)</label>
                <input type="url" className="input-dark" placeholder="https://..." value={form.link} onChange={e => setForm(p => ({...p, link: e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Urutan</label>
                <input type="number" className="input-dark" value={form.order_position} onChange={e => setForm(p => ({...p, order_position: e.target.value}))} min="0" />
                <p className="text-xs text-gray-500 mt-1">Angka kecil = tampil lebih dulu</p>
              </div>
              {formError && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">{formError}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={formLoading} className="btn-primary flex-1 disabled:opacity-50">
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
        }
