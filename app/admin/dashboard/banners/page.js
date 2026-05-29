'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState({ image_url:'', title:'', link:'', order_position:'0', is_active:true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('banners').select('*').order('order_position', { ascending: true });
    setBanners(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.image_url) return alert('Image URL wajib diisi');
    setSaving(true);
    await supabase.from('banners').insert({ ...form, order_position: parseInt(form.order_position), is_active: Boolean(form.is_active) });
    setForm({ image_url:'', title:'', link:'', order_position:'0', is_active:true });
    setSaving(false); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus banner ini?')) return;
    await supabase.from('banners').delete().eq('id', id);
    load();
  };

  const toggleActive = async (b) => {
    await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Tambah Banner</h3>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Image URL *</label>
            <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="input-field" required placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Judul</label>
            <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Link</label>
            <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Urutan</label>
            <input type="number" value={form.order_position} onChange={e => setForm({...form, order_position: e.target.value})} className="input-field" />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Menyimpan...' : 'Tambah Banner'}</button>
          </div>
        </form>
      </div>

      {banners.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-500">Belum ada banner.</div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="glass-card p-4 flex items-center gap-4">
              <img src={b.image_url} alt={b.title || ''} className="w-32 h-20 rounded-xl object-cover bg-dark-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{b.title || 'Tanpa Judul'}</p>
                <p className="text-xs text-gray-500 truncate">{b.link || '-'}</p>
                <p className="text-xs text-gray-400 mt-1">Urutan: {b.order_position} | {b.is_active ? 'Aktif' : 'Nonaktif'}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(b)} className="btn-secondary text-xs py-1.5 px-3">{b.is_active ? 'Nonaktif' : 'Aktifkan'}</button>
                <button onClick={() => handleDelete(b.id)} className="btn-danger text-xs py-1.5 px-3">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
                       }
