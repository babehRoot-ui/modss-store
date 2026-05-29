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
        const { data: updated } = await supabaseAdmin.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('order_id', params.order_id).select().single();
        await supabaseAdmin.from('transactions').update({ status: 'paid', raw_response: payResult }).eq('order_id', params.order_id);

        // Trigger delivery
        if (updated) {
          try {
            const deliveryRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('/supabase', '') || ''}/api/delivery/${getCategoryEndpoint(updated)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order_id: updated.order_id })
            });
            // Tidak perlu wait, biarkan async
          } catch (delErr) {
            console.error('Delivery trigger error:', delErr.message);
          }
        }
        return NextResponse.json({ order: updated || order });
      }
    } catch (err) {
      console.error('Payment check error:', err.message);
    }
  }

  // Jika status paid tapi belum delivered, trigger delivery
  if (order.status === 'paid' && !order.delivery_data) {
    try {
      await fetch(`/api/delivery/${getCategoryEndpoint(order)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.order_id })
      });
    } catch {}
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

function getCategoryEndpoint(order) {
  // Perlu fetch product category
  // Simplified: cek dari product info yang ada
  return 'script'; // fallback, akan di-handle oleh delivery routes
}
