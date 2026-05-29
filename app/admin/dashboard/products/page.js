'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', price:'', category:'panel', type:'', stock:'999', file_url:'', panel_domain:'', panel_plta:'', panel_pltc:'', badge:'', image_url:'', is_active:true, config:'{}' });
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const resetForm = () => {
    setForm({ name:'', description:'', price:'', category:'panel', type:'', stock:'999', file_url:'', panel_domain:'', panel_plta:'', panel_pltc:'', badge:'', image_url:'', is_active:true, config:'{}' });
    setEditId(null); setShowForm(false);
  };

  const handleEdit = (p) => {
    setForm({ name:p.name, description:p.description||'', price:String(p.price), category:p.category, type:p.type||'', stock:String(p.stock||999), file_url:p.file_url||'', panel_domain:p.panel_domain||'', panel_plta:p.panel_plta||'', panel_pltc:p.panel_pltc||'', badge:p.badge||'', image_url:p.image_url||'', is_active:p.is_active, config:JSON.stringify(p.config||{}) });
    setEditId(p.id); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return alert('Nama dan harga wajib diisi');
    setSaving(true);
    const payload = { ...form, price: parseInt(form.price), stock: parseInt(form.stock), is_active: Boolean(form.is_active) };
    try {
      let configObj = {};
      try { configObj = JSON.parse(form.config); } catch {}
      payload.config = configObj;
      if (editId) {
        await supabase.from('products').update(payload).eq('id', editId);
      } else {
        await supabase.from('products').insert(payload);
      }
      resetForm(); loadProducts();
    } catch (err) { alert('Gagal menyimpan: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk ini?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadProducts();
  };

  const toggleActive = async (p) => {
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    loadProducts();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400">{products.length} produk</p>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">+ Tambah Produk</button>
      </div>

      {showForm && (
        <div className="glass-card p-6 animate-slide-down">
          <h3 className="text-sm font-semibold text-white mb-4">{editId ? 'Edit' : 'Tambah'} Produk</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Nama Produk *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Deskripsi</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field" rows={2} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Harga (Rp) *</label>
              <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Kategori *</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field">
                <option value="panel">Panel</option><option value="script">Script</option><option value="vps">VPS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipe</label>
              <input value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field" placeholder="Contoh: Minecraft, RDP" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Stok</label>
              <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Badge</label>
              <select value={form.badge} onChange={e => setForm({...form, badge: e.target.value})} className="input-field">
                <option value="">Tanpa Badge</option><option value="HOT">HOT</option><option value="SALE">SALE</option><option value="LIMITED">LIMITED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Image URL *</label>
              <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Aktif</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 accent-accent" />
                <span className="text-sm text-gray-300">Tampilkan di toko</span>
              </label>
            </div>

            {/* Field khusus Script */}
            {form.category === 'script' && (
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">File URL (link download script)</label>
                <input value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})} className="input-field" placeholder="https://drive.google.com/..." />
              </div>
            )}

            {/* Field khusus Panel */}
            {form.category === 'panel' && (
              <>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Panel Domain *</label>
                  <input value={form.panel_domain} onChange={e => setForm({...form, panel_domain: e.target.value})} className="input-field" placeholder="https://panel.example.com" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">PLTA (Token Admin) *</label>
                  <input type="password" value={form.panel_plta} onChange={e => setForm({...form, panel_plta: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">PLTC (Token Client) *</label>
                  <input type="password" value={form.panel_pltc} onChange={e => setForm({...form, panel_pltc: e.target.value})} className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Config (JSON: node_id, egg_id, nest_id, memory, disk, cpu)</label>
                  <textarea value={form.config} onChange={e => setForm({...form, config: e.target.value})} className="input-field font-mono text-xs" rows={3} placeholder='{"node_id":1,"egg_id":15,"nest_id":1,"memory":1024,"disk":10240,"cpu":100}' />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              <button type="button" onClick={resetForm} className="btn-secondary text-sm">Batal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="text-center py-12 text-gray-400">Memuat...</div> : products.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-500">Belum ada produk. Klik "+ Tambah Produk" untuk memulai.</div>
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <div key={p.id} className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img src={p.image_url || '/images/default-product.jpg'} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-dark-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white text-sm truncate">{p.name}</span>
                  {p.badge && <span className={`badge badge-${p.badge.toLowerCase()}`}>{p.badge}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${p.is_active ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-gray-500 border-gray-500/30 bg-gray-500/10'}`}>{p.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="text-accent font-semibold">{formatRupiah(p.price)}</span>
                  <span className="uppercase">{p.category}</span>
                  <span>Stok: {p.stock}</span>
                </div>
                {p.category === 'panel' && p.panel_domain && <p className="text-xs text-gray-500 mt-1 font-mono">{p.panel_domain}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(p)} className="btn-secondary text-xs py-1.5 px-3">{p.is_active ? 'Nonaktif' : 'Aktifkan'}</button>
                <button onClick={() => handleEdit(p)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="btn-danger text-xs py-1.5 px-3">Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
    }
