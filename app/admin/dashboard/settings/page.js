'use client';

import { useState, useEffect } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ store_name: 'BABEH DIGITAL STORE', admin_phone: '6285137574436' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabaseAdmin.from('settings').select('*');
      if (data) {
        const map = {};
        data.forEach(s => map[s.key] = s.value);
        setSettings(prev => ({ ...prev, ...map }));
      }
    }
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSaved(false);
    for (const [key, value] of Object.entries(settings)) {
      await supabaseAdmin.from('settings').upsert({ key, value }, { onConflict: 'key' });
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Pengaturan Umum</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nama Toko</label>
            <input value={settings.store_name || ''} onChange={e => setSettings({...settings, store_name: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nomor WhatsApp Admin</label>
            <input value={settings.admin_phone || ''} onChange={e => setSettings({...settings, admin_phone: e.target.value})} className="input-field" placeholder="628xxxxxxxxxx" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</button>
          {saved && <span className="text-accent text-sm ml-3">Tersimpan!</span>}
        </form>
      </div>
    </div>
  );
  }
