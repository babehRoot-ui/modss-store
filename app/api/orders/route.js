import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createPayment } from '@/lib/pakasir';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { order_id, product_id, product_name, product_price, customer_name, customer_phone, customer_email } = body;

    // Buat pembayaran Pakasir
    let paymentResult = null;
    try {
      paymentResult = await createPayment({
        amount: product_price,
        externalId: order_id,
        customerName: customer_name,
        customerPhone: customer_phone
      });
    } catch (err) {
      // Jika Pakasir gagal, simpan order tanpa payment info
      console.error('Pakasir error:', err.message);
    }

    const expiredAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const orderPayload = {
      order_id,
      product_id,
      product_name,
      product_price,
      customer_name,
      customer_phone,
      customer_email,
      status: 'pending',
      payment_qr: paymentResult?.data?.qr_string || null,
      payment_link: paymentResult?.data?.payment_url || null,
      payment_id: paymentResult?.data?.id || null,
      payment_expired: expiredAt
    };

    const { data: order, error } = await supabaseAdmin.from('orders').insert(orderPayload).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log transaksi
    if (paymentResult) {
      await supabaseAdmin.from('transactions').insert({
        order_id,
        pakasir_id: paymentResult?.data?.id,
        amount: product_price,
        status: 'pending',
        raw_response: paymentResult
      });
    }

    return NextResponse.json({
      order,
      payment: {
        qr_string: paymentResult?.data?.qr_string || null,
        payment_url: paymentResult?.data?.payment_url || null,
        id: paymentResult?.data?.id || null
      }
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
