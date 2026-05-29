export function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

export function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BDS-${ts}-${rand}`;
}

export function getStatusColor(status) {
  const map = {
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    paid: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    delivered: 'text-green-400 bg-green-400/10 border-green-400/30',
    failed: 'text-red-400 bg-red-400/10 border-red-400/30'
  };
  return map[status] || 'text-gray-400 bg-gray-400/10 border-gray-400/30';
}

export function getStatusLabel(status) {
  const map = { pending:'Menunggu Pembayaran', paid:'Sudah Dibayar', delivered:'Terkirim', failed:'Gagal' };
  return map[status] || status;
}

export async function sendWhatsApp(phone, message) {
  const adminPhone = process.env.ADMIN_PHONE || '6285137574436';
  // Metode 1: Fonnte API (uncomment & isi FONTE_API_KEY di .env.local)
  // try {
  //   await fetch('https://api.fonnte.com/send', {
  //     method: 'POST',
  //     headers: { 'Authorization': process.env.FONTE_API_KEY, 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ target: phone, message })
  //   });
  //   return true;
  // } catch {}

  // Metode 2: Log untuk development (ganti dengan API WA yang tersedia)
  console.log(`[WA TO ${phone}]: ${message}`);
  return true;
}

export function getCategoryInfo(cat) {
  const map = {
    panel: { label: 'Panel', icon: '🖥️', color: 'from-cyan-600 to-blue-600' },
    script: { label: 'Script', icon: '📜', color: 'from-purple-600 to-pink-600' },
    vps: { label: 'VPS', icon: '🌐', color: 'from-green-600 to-emerald-600' }
  };
  return map[cat] || { label: cat, icon: '📦', color: 'from-gray-600 to-gray-700' };
}
