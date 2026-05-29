'use client';

import { useState, useEffect } from 'react';
import { formatRupiah, getCategoryLabel } from '@/lib/utils';

function getAdminToken() {
  if (typeof document === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('admin_token='))
    ?.split('=')[1] || null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'panel',
    type: '',
    stock: '999',
    file_url: '',
    image_url: '',
    badge: '',
    panel_domain: '',
    panel_plta: '',
    panel_pltc: '',
  });

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/products?admin=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Gagal memuat produk');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditId(null);
    setForm({
      name: '',
      description: '',
      price: '',
      category: 'panel',
      type: '',
      stock: '999',
      file_url: '',
      image_url: '',
      badge: '',
      panel_domain: '',
      panel_plta: '',
      panel_pltc: '',
    });
    setFormError('');
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditId(product.id);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: String(product.price || ''),
      category: product.category || 'panel',
      type: product.type || '',
      stock: String(product.stock ?? 999),
      file_url: product.file_url || '',
      image_url: product.image_url || '',
      badge: product.badge || '',
      panel_domain: product.panel_domain || '',
      panel_plta: product.panel_plta || '',
      panel_pltc: product.panel_pltc || '',
    });
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const token = getAdminToken();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseInt(form.price),
      category: form.category,
      type: form.type || null,
      stock: parseInt(form.stock) || 999,
      file_url: form.file_url || null,
      image_url: form.image_url || null,
      badge: form.badge || null,
      is_active: true,
    };

    if (form.category === 'panel') {
      payload.panel_domain = form.panel_domain || null;
      payload.panel_plta = form.panel_plta || null;
      payload.panel_pltc = form.panel_pltc || null;
    } else {
      payload.panel_domain = null;
      payload.panel_plta = null;
      payload.panel_pltc = null;
    }

    try {
      let res;
      if (editId) {
        res = await fetch(`/api/products/${editId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan produk');

      setShowForm(false);
      loadProducts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Hapus produk ini?')) return;
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus');
      }
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggleActive(product) {
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !product.is_active }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal update');
      }
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{products.length} produk</p>
        <button onClick={openAddForm} className="btn-primary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah Produk
        </button>
      </div>

      {/* Product Table */}
      <div className="card-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Badge</th>
                <th>Active</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-600 overflow-hidden flex-shrink-0">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">
                            {p.category === 'panel' ? '🖥️' : p.category === 'script' ? '📄' : '🖥️'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate max-w-[200px]">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{p.type || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs bg-dark-500 px-2 py-0.5 rounded">
                      {getCategoryLabel(p.category)}
                    </span>
                  </td>
                  <td className="font-medium">{formatRupiah(p.price)}</td>
                  <td>
                    {p.badge ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        p.badge === 'SALE' ? 'bg-red-500/20 text-red-400' :
                        p.badge === 'HOT' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {p.badge}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                        p.is_active
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                    >
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditForm(p)}
                        className="p-1.5 rounded-lg bg-dark-500 text-gray-400 hover:text-white hover:bg-dark-400 transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-lg bg-dark-500 text-red-400 hover:bg-red-500/20 transition-all"
                        title="Hapus"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-500">Belum ada produk</div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-dark-400/30 flex items-center justify-between">
              <h3 className="font-bold text-lg">{editId ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Nama */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Nama Produk *</label>
                  <input
                    type="text"
                    className="input-dark"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="contoh: Panel Minecraft 1GB"
                    required
                  />
                </div>

                {/* Deskripsi */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Deskripsi</label>
                  <textarea
                    className="input-dark"
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Deskripsi singkat produk"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Kategori *</label>
                  <select
                    className="input-dark"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  >
                    <option value="panel">Pterodactyl Panel</option>
                    <option value="script">Script / File Digital</option>
                    <option value="vps">VPS DigitalOcean</option>
                  </select>
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Harga (IDR) *</label>
                  <input
                    type="number"
                    className="input-dark"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="15000"
                    required
                    min="1"
                  />
                </div>

                {/* Tipe */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Tipe / Variasi</label>
                  <input
                    type="text"
                    className="input-dark"
                    placeholder="contoh: 1GB RAM"
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Stock</label>
                  <input
                    type="number"
                    className="input-dark"
                    value={form.stock}
                    onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                    min="0"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Badge</label>
                  <select
                    className="input-dark"
                    value={form.badge}
                    onChange={e => setForm(p => ({ ...p, badge: e.target.value }))}
                  >
                    <option value="">Tidak Ada</option>
                    <option value="SALE">SALE</option>
                    <option value="HOT">HOT</option>
                    <option value="NEW">NEW</option>
                  </select>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Image URL</label>
                  <input
                    type="url"
                    className="input-dark"
                    placeholder="https://example.com/gambar.jpg"
                    value={form.image_url}
                    onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                  />
                </div>

                {/* FILE URL — khusus script */}
                {form.category === 'script' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      File URL (Link Download) *
                    </label>
                    <input
                      type="url"
                      className="input-dark"
                      placeholder="https://drive.google.com/file/d/..."
                      value={form.file_url}
                      onChange={e => setForm(p => ({ ...p, file_url: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Link download file script/zip yang akan dikirim ke customer</p>
                  </div>
                )}

                {/* ====== PANEL SPECIFIC — WAJIB ISI SEMUA ====== */}
                {form.category === 'panel' && (
                  <>
                    <div className="col-span-2 mt-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-sm font-semibold text-blue-400">Konfigurasi Pterodactyl Panel</p>
                      </div>
                      <p className="text-xs text-blue-400/70 ml-6">Ketiga field di bawah ini WAJIB diisi untuk produk panel</p>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Panel Domain *
                      </label>
                      <input
                        type="url"
                        className="input-dark"
                        placeholder="https://panel.domain.com"
                        value={form.panel_domain}
                        onChange={e => setForm(p => ({ ...p, panel_domain: e.target.value }))}
                        required={form.category === 'panel'}
                      />
                      <p className="text-xs text-gray-500 mt-1">URL lengkap panel Pterodactyl kamu</p>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        PLTA (Application API Key) *
                      </label>
                      <input
                        type="text"
                        className="input-dark font-mono text-xs"
                        placeholder="ptla_xxxxxxxxxxxxxxxxxxxx"
                        value={form.panel_plta}
                        onChange={e => setForm(p => ({ ...p, panel_plta: e.target.value }))}
                        required={form.category === 'panel'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dari: Panel Admin → API Credentials → Create Application API Key
                      </p>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        PLTC (Client API Key) *
                      </label>
                      <input
                        type="text"
                        className="input-dark font-mono text-xs"
                        placeholder="ptlc_xxxxxxxxxxxxxxxxxxxx"
                        value={form.panel_pltc}
                        onChange={e => setForm(p => ({ ...p, panel_pltc: e.target.value }))}
                        required={form.category === 'panel'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dari: Account Settings → API Credentials → Create Client API Key
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Error */}
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
                  {formError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <div className="spinner w-4 h-4 border-2 border-white/20 border-t-white" />
                      Menyimpan...
                    </>
                  ) : editId ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Produk'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
                          }
