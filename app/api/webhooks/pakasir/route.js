import { NextResponse } from 'next/server';
import { getOrderByOrderId, updateOrder, createTransaction } from '@/lib/supabase';
import { deliverProduct } from '@/lib/delivery';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Pakasir Webhook received:', JSON.stringify(body));

    // Pakasir biasanya mengirim order_id dan status
    const orderId = body.order_id || body.data?.order_id;
    const status = body.status || body.data?.status;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing order_id or status' }, { status: 400 });
    }

    // Cari order
    const order = await getOrderByOrderId(orderId);
    if (!order) {
      console.error(`Order ${orderId} not found`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update transaksi log
    try {
      await createTransaction({
        order_id: orderId,
        pakasir_id: body.id || body.data?.id || null,
        amount: order.product_price,
        status: status,
        raw_response: body,
      });
    } catch {}

    // Jika pembayaran berhasil
    if (status === 'paid' || status === 'success' || status === 'settlement') {
      if (order.status === 'pending') {
        // Update status ke paid
        await updateOrder(orderId, {
          status: 'paid',
          paid_at: new Date().toISOString(),
        });

        // Proses delivery secara async (tidak blocking response webhook)
        // Gunakan setTimeout agar webhook response cepat
        setTimeout(async () => {
          try {
            await deliverProduct(orderId);
          } catch (err) {
            console.error(`Delivery failed for ${orderId}:`, err);
            await updateOrder(orderId, {
              status: 'failed',
              delivery_data: { error: err.message },
            });
          }
        }, 1000);
      }
    }

    // Jika pembayaran gagal/expired
    if (status === 'expired' || status === 'failed' || status === 'cancelled') {
      if (order.status === 'pending') {
        await updateOrder(orderId, { status: status === 'expired' ? 'expired' : 'failed' });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
