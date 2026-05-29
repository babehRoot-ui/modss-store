import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const externalId = body?.data?.external_id || body?.external_id;
    const status = body?.data?.status || body?.status;

    if (!externalId) return NextResponse.json({ error: 'Missing external_id' }, { status: 400 });

    // Cari order
    const { data: order, error } = await supabaseAdmin.from('orders').select('*, products(category)').eq('order_id', externalId).single();
    if (error || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (status === 'paid' || status === 'success' || status === 'settlement') {
      // Update order status
      await supabaseAdmin.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('order_id', externalId);
      await supabaseAdmin.from('transactions').update({ status: 'paid', raw_response: body }).eq('order_id', externalId);

      // Trigger delivery
      const category = order.products?.category || 'script';
      const baseUrl = request.headers.get('host') || '';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';

      try {
        await fetch(`${protocol}://${baseUrl}/api/delivery/${category}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: externalId })
        });
      } catch (delErr) {
        console.error('Webhook delivery error:', delErr.message);
      }
    } else if (status === 'failed' || status === 'expired') {
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('order_id', externalId);
      await supabaseAdmin.from('transactions').update({ status: 'failed', raw_response: body }).eq('order_id', externalId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
