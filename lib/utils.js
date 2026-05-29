export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderId() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BD-${y}${m}${d}-${rand}`;
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function getStatusColor(status) {
  const colors = {
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    paid: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    delivered: 'text-green-400 bg-green-400/10 border-green-400/20',
    failed: 'text-red-400 bg-red-400/10 border-red-400/20',
    expired: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  };
  return colors[status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20';
}

export function getCategoryLabel(cat) {
  const labels = {
    panel: 'Pterodactyl Panel',
    script: 'Script / File Digital',
    vps: 'VPS DigitalOcean',
  };
  return labels[cat] || cat;
}

export function getCategoryColor(cat) {
  const colors = {
    panel: 'from-blue-500 to-cyan-500',
    script: 'from-purple-500 to-pink-500',
    vps: 'from-green-500 to-emerald-500',
  };
  return colors[cat] || 'from-gray-500 to-gray-600';
}

export async function sendWhatsApp(phone, message) {
  const adminPhone = process.env.ADMIN_PHONE;
  // Ini menggunakan wa.me link sebagai fallback
  // Untuk production, gunakan WhatsApp Business API
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function generateDeliveryMessage(order, deliveryData) {
  const lines = [
    `*BABEH DIGITAL STORE*`,
    `━━━━━━━━━━━━━━━━━━`,
    `Order ID: *${order.order_id}*`,
    `Produk: *${order.product_name}*`,
    `Status: *${order.status.toUpperCase()}*`,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
  ];

  if (order.status === 'delivered' && deliveryData) {
    if (order.product_name?.toLowerCase().includes('panel') || deliveryData.panel_url) {
      lines.push('*Detail Panel:*');
      lines.push(`URL: ${deliveryData.panel_url}`);
      lines.push(`Username: ${deliveryData.username}`);
      lines.push(`Server ID: ${deliveryData.server_id}`);
      lines.push(`Email: ${deliveryData.email}`);
      lines.push('');
      lines.push('*Langkah Login:*');
      lines.push('1. Buka URL panel di atas');
      lines.push('2. Login pakai username & email');
      lines.push('3. Cek email untuk password awal');
    } else if (deliveryData.ip) {
      lines.push('*Detail VPS:*');
      lines.push(`IP Address: ${deliveryData.ip}`);
      lines.push(`Username: ${deliveryData.username || 'root'}`);
      lines.push(`Password: ${deliveryData.password}`);
      lines.push(`Region: ${deliveryData.region || 'Singapore'}`);
      lines.push(`Size: ${deliveryData.size || '-'}'`);
    } else if (deliveryData.file_url) {
      lines.push('*Link Download:*');
      lines.push(deliveryData.file_url);
      lines.push('');
      lines.push('*Cara Pakai:*');
      lines.push('1. Download file di atas');
      lines.push('2. Extract / unzip');
      lines.push('3. Baca README.txt untuk instruksi');
    }
  }

  lines.push('');
  lines.push('Terima kasih telah berbelanja!');
  lines.push('*BABEH DIGITAL STORE*');

  return lines.join('\n');
}
