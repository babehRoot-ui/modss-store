import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DigitalOceanAPI } from '@/lib/digitalocean';
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

    // Ambil DO API Key dari tabel api_keys
    const { data: doKeys, error: keyErr } = await supabaseAdmin.from('api_keys').select('*').eq('type', 'do').eq('is_active', true);
    if (keyErr || !doKeys || doKeys.length === 0) {
      throw new Error('DigitalOcean API Key tidak ditemukan. Tambahkan di menu API Keys admin.');
    }

    const doKey = doKeys[0];
    const doApi = new DigitalOceanAPI(doKey.api_key);
    const config = product.config || {};

    // Buat droplet
    const dropletName = `vps-${order.order_id.toLowerCase().replace(/[^a-z0-9-]/g, '')}`;
    const result = await doApi.createDroplet({
      name: dropletName,
      region: config.region || 'sgp1',
      size: config.size || 's-1vcpu-1gb',
      image: config.image || 'ubuntu-22-04-x64'
    });

    const droplet = result?.droplet;
    const ipv4 = droplet?.networks?.v4?.find(n => n.type === 'public')?.ip_address || 'Pending';
    const rootPassword = result?.root_password || doApi.genPassword();

    const deliveryData = {
      type: 'vps',
      droplet_id: droplet?.id,
      droplet_name: dropletName,
      ip_address: ipv4,
      username: 'root',
      password: rootPassword,
      region: config.region || 'sgp1',
      size: config.size || 's-1vcpu-1gb',
      image: config.image || 'ubuntu-22-04-x64',
      message: 'VPS berhasil dibuat! IP mungkin perlu 1-2 menit untuk aktif.'
    };

    // Update order
    await supabaseAdmin.from('orders').update({
      status: 'delivered',
      delivery_data: deliveryData
    }).eq('order_id', order_id);

    // Kirim WhatsApp
    const waMessage = `*BABEH DIGITAL STORE - VPS Terkirim!*\n\n` +
      `Order ID: ${order_id}\n` +
      `Produk: ${product.name}\n\n` +
      `*Detail VPS:*\n` +
      `IP Address: ${ipv4}\n` +
      `Username: root\n` +
      `Password: ${rootPassword}\n` +
      `Region: ${config.region || 'sgp1'}\n` +
      `Size: ${config.size || 's-1vcpu-1gb'}\n` +
      `OS: ${config.image || 'ubuntu-22-04-x64'}\n\n` +
      `Catatan: VPS baru butuh 1-2 menit untuk fully boot. Simpan data ini dengan baik. Terima kasih! 🎉`;

    await sendWhatsApp(order.customer_phone, waMessage);

    return NextResponse.json({ success: true, delivery: deliveryData });

  } catch (err) {
    console.error('VPS delivery error:', err);

    try {
      const { order_id } = await request.json();
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('order_id', order_id);
    } catch {}

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
