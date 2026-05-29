import { NextResponse } from 'next/server';
import { getProductById, createOrder, createTransaction, getOrderByOrderId, updateOrder, getAllOrders } from '@/lib/supabase';
import { createPakasirPayment } from '@/lib/pakasir';
import { generateOrderId } from '@/lib/utils';
import { verifyAdminToken } from '@/lib/auth';

// GET: Cek status order
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const admin = searchParams.get('admin');

    if (admin === 'true') {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token || !verifyAdminToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const orders = await getAllOrders();
      return NextResponse.json(orders);
    }

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID diperlukan' }, { status: 400 });
    }

    const order = await getOrderByOrderId(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    // Jika status masih pending, cek ke Pakasir
    if (order.status === 'pending' && order.payment_link) {
      try {
        // Cek apakah QR sudah expired (24 jam)
        const created = new Date(order.created_at);
        const now = new Date();
        const diffHours = (now - created) / (1000 * 60 * 60);
        if (diffHours > 24) {
          await updateOrder(orderId, { status: 'expired' });
          order.status = 'expired';
        }
      } catch {}
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Buat order baru + generate QRIS
export async function POST(request) {
  try {
    const body = await request.json();
    const { product_id, customer_phone, customer_name, customer_email } = body;

    if (!product_id || !customer_phone) {
      return NextResponse.json({ error: 'Product ID dan Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    // Validasi phone
    let phone = customer_phone.replace(/[\s\-\+]/g, '');
    if (phone.startsWith('08')) phone = '62' + phone.substring(1);
    if (phone.length < 10) {
      return NextResponse.json({ error: 'Nomor WhatsApp tidak valid' }, { status: 400 });
    }

    // Ambil produk
    const product = await getProductById(product_id);
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }
    if (!product.is_active) {
      return NextResponse.json({ error: 'Produk tidak tersedia' }, { status: 400 });
    }

    // Generate order ID
    const orderId = generateOrderId();

    // Buat transaksi Pakasir
    let pakasirData = null;
    let paymentQr = null;
    let paymentLink = null;

    try {
      pakasirData = await createPakasirPayment({
        orderId,
        amount: product.price,
        customerName: customer_name || 'Customer',
        customerPhone: phone,
        customerEmail: customer_email || '',
      });

      paymentQr = pakasirData.data?.qr_image || pakasirData.qr_image || null;
      paymentLink = pakasirData.data?.payment_url || pakasirData.payment_url || pakasirData.data?.checkout_url || null;
    } catch (err) {
      console.error('Pakasir Error:', err);
      return NextResponse.json({ error: `Gagal membuat pembayaran: ${err.message}` }, { status: 500 });
    }

    // Simpan order ke database
    const order = await createOrder({
      order_id: orderId,
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      customer_name: customer_name || null,
      customer_phone: phone,
      customer_email: customer_email || null,
      status: 'pending',
      payment_method: 'qris',
      payment_qr: paymentQr,
      payment_link: paymentLink,
      payment_expired: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    // Simpan transaksi log
    try {
      await createTransaction({
        order_id: orderId,
        pakasir_id: pakasirData.data?.id || pakasirData.id || null,
        amount: product.price,
        status: 'pending',
        raw_response: pakasirData,
      });
    } catch (err) {
      console.error('Failed to log transaction:', err);
    }

    return NextResponse.json({
      order_id: orderId,
      payment_qr: paymentQr,
      payment_link: paymentLink,
    }, { status: 201 });
  } catch (error) {
    console.error('Order Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
