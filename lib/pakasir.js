const PAKASIR_BASE = 'https://pakasir.com/api/v1';

export async function createPayment({ amount, externalId, customerName, customerPhone }) {
  const res = await fetch(`${PAKASIR_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAKASIR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      method: 'qris',
      project: process.env.PAKASIR_PROJECT,
      external_id: externalId,
      customer_name: customerName || 'Customer',
      customer_phone: customerPhone
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pakasir error: ${res.status} - ${err}`);
  }
  return res.json();
}

export async function checkPayment(paymentId) {
  const res = await fetch(`${PAKASIR_BASE}/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${process.env.PAKASIR_API_KEY}` }
  });
  if (!res.ok) throw new Error(`Pakasir check error: ${res.status}`);
  return res.json();
}
