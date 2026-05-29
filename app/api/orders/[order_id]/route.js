import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkPayment } from '@/lib/pakasir';

export async function GET(request, { params }) {
  const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('order_id', params.order_id).single();
  if (error || !order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });

  // Jika status pending dan ada payment_id, cek status ke Pakasir
  if (order.status === 'pending' && order.payment_id) {
    try {
      const payResult = await checkPayment(order.payment_id);
      const payStatus = payResult?.data?.status || payResult?.status;
      if (payStatus === 'paid' || payStatus === 'success' || payStatus === 'settlement') {
        // Update status ke paid
        await supabaseAdmin.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('order_id', params.order_id);
        await supabaseAdmin.from('transactions').update({ status: 'paid', raw_response: payResult }).eq('order_id', params.order_id);

        // Fetch product untuk tau kategori
        const { data: product } = await supabaseAdmin.from('products').select('category').eq('id', order.product_id).single();
        const category = product?.category || 'script';

        // Trigger delivery
        try {
          const baseUrl = request.headers.get('host') || '';
          const protocol = request.headers.get('x-forwarded-proto') || 'https';
          await fetch(`${protocol}://${baseUrl}/api/delivery/${category}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: params.order_id })
          });
        } catch (delErr) {
          console.error('Delivery trigger error:', delErr.message);
        }

        // Re-fetch order yang sudah di-update
        const { data: updated } = await supabaseAdmin.from('orders').select('*').eq('order_id', params.order_id).single();
        return NextResponse.json({ order: updated || order });
      }
    } catch (err) {
      console.error('Payment check error:', err.message);
    }
  }

  // Jika status paid tapi belum delivered, trigger delivery
  if (order.status === 'paid' && !order.delivery_data) {
    try {
      const { data: product } = await supabaseAdmin.from('products').select('category').eq('id', order.product_id).single();
      const category = product?.category || 'script';
      const baseUrl = request.headers.get('host') || '';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      await fetch(`${protocol}://${baseUrl}/api/delivery/${category}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: params.order_id })
      });
    } catch (delErr) {
      console.error('Retry delivery error:', delErr.message);
    }

    // Re-fetch
    const { data: refreshed } = await supabaseAdmin.from('orders').select('*').eq('order_id', params.order_id).single();
    if (refreshed) return NextResponse.json({ order: refreshed });
  }

  return NextResponse.json({ order });
}

export async function PUT(request, { params }) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from('orders').update(body).eq('order_id', params.order_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
