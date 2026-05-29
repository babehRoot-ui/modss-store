import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsApp } from '@/lib/utils';

export async function POST(request) {
  try {
    const { order_id } = await request.json();

    // Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin.from('orders').select('*').eq('order_id', order_id).single();
    if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Fetch product
    const { data: product, error: prodErr } = await supabaseAdmin.from('products').select('*').eq('id', order.product_id).single();
    if (prodErr || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (!product.file_url) {
      throw new Error('Produk script tidak memiliki file_url. Tambahkan link download di pengaturan produk.');
    }

    const deliveryData = {
      type: 'script',
      product_name: product.name,
      download_url: product.file_url,
      message: 'Link download script sudah tersedia.'
    };

    // Update order
    await supabaseAdmin.from('orders').update({
      status: 'delivered',
      delivery_data: deliveryData
    }).eq('order_id', order_id);

    // Kirim WhatsApp
    const waMessage = `*BABEH DIGITAL STORE - Script Terkirim!*\n\n` +
      `Order ID: ${order_id}\n` +
      `Produk: ${product.name}\n\n` +
      `*Link Download:*\n${product.file_url}\n\n` +
      `Jika link tidak bisa diakses, hubungi admin. Terima kasih! 🎉`;

    await sendWhatsApp(order.customer_phone, waMessage);

    // Kirim email jika ada
    if (order.customer_email) {
      console.log(`[EMAIL TO ${order.customer_email}]: Script delivery for ${order_id} - ${product.file_url}`);
      // Integrasi email service di sini (misalnya Resend, SendGrid, dll)
    }

    return NextResponse.json({ success: true, delivery: deliveryData });

  } catch (err) {
    console.error('Script delivery error:', err);

    try {
      const { order_id } = await request.json();
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('order_id', order_id);
    } catch {}

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
