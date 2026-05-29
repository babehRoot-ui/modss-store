const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY;
const PAKASIR_PROJECT = process.env.PAKASIR_PROJECT;
const PAKASIR_BASE = 'https://pakasir.com/api/v1';

export async function createPakasirPayment({ orderId, amount, customerName, customerPhone, customerEmail }) {
  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/pakasir`;

  const body = {
    project: PAKASIR_PROJECT,
    amount: amount,
    order_id: orderId,
    name: customerName || 'Customer',
    phone: customerPhone,
    email: customerEmail || '',
    note: `Order ${orderId}`,
    callback_url: callbackUrl,
    redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/track/${orderId}`,
    payment_method: 'qris',
  };

  const res = await fetch(`${PAKASIR_BASE}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PAKASIR_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal membuat pembayaran Pakasir');
  }
  return data;
}

export async function checkPakasirStatus(pakasirId) {
  const res = await fetch(`${PAKASIR_BASE}/transactions/${pakasirId}`, {
    headers: {
      'Authorization': `Bearer ${PAKASIR_API_KEY}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Gagal cek status');
  return data;
}
