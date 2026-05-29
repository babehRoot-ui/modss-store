import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PterodactylAPI } from '@/lib/pterodactyl';
import { sendWhatsApp } from '@/lib/utils';

export async function POST(request) {
  try {
    const { order_id } = await request.json();

    // Fetch order + product
    const { data: order, error: orderErr } = await supabaseAdmin.from('orders').select('*').eq('order_id', order_id).single();
    if (orderErr || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const { data: product, error: prodErr } = await supabaseAdmin.from('products').select('*').eq('id', order.product_id).single();
    if (prodErr || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (!product.panel_domain || !product.panel_plta) {
      throw new Error('Produk panel tidak memiliki konfigurasi lengkap (domain/PLTA)');
    }

    const ptero = new PterodactylAPI(product.panel_domain, product.panel_plta, product.panel_pltc || '');
    const config = product.config || {};
    const password = ptero.genPassword();
    const username = `user_${Date.now().toString(36)}`;
    const email = `${username}@babeh-store.com`;

    // 1. Buat user di Pterodactyl
    const userResult = await ptero.createUser(email, username, order.customer_name || 'Customer', '');
    const userId = userResult?.attributes?.id;

    // 2. Dapatkan allocation ID
    let allocationId = config.allocation_id;
    if (!allocationId && config.node_id) {
      const allocs = await ptero.getAllocations(config.node_id);
      const freeAlloc = allocs?.data?.find(a => !a.attributes?.assigned);
      if (!freeAlloc) throw new Error('Tidak ada allocation tersedia di node ini');
      allocationId = freeAlloc.attributes.id;
    }
    if (!allocationId) throw new Error('Allocation ID tidak ditemukan. Set allocation_id di config produk atau pastikan ada allocation free di node.');

    // 3. Buat server
    const serverResult = await ptero.createServer({
      name: `${product.name} - ${order.order_id}`,
      description: `Order ${order.order_id}`,
      userId,
      eggId: config.egg_id || 1,
      nestId: config.nest_id || 1,
      nodeId: config.node_id || 1,
      allocationId,
      memory: config.memory || 1024,
      disk: config.disk || 10240,
      cpu: config.cpu || 100
    });

    const deliveryData = {
      type: 'panel',
      server_name: serverResult?.attributes?.name,
      server_id: serverResult?.attributes?.identifier,
      username,
      password,
      email,
      panel_url: product.panel_domain,
      message: 'Server panel berhasil dibuat!'
    };

    // Update order ke delivered
    await supabaseAdmin.from('orders').update({
      status: 'delivered',
      delivery_data: deliveryData
    }).eq('order_id', order_id);

    // Kirim notifikasi WhatsApp
    const waMessage = `*BABEH DIGITAL STORE - Produk Terkirim!*\n\n` +
      `Order ID: ${order_id}\n` +
      `Produk: ${product.name}\n\n` +
      `*Detail Login Panel:*\n` +
      `URL: ${product.panel_domain}\n` +
      `Username: ${username}\n` +
      `Password: ${password}\n` +
      `Server ID: ${serverResult?.attributes?.identifier}\n\n` +
      `Simpan data ini dengan baik. Terima kasih! 🎉`;

    await sendWhatsApp(order.customer_phone, waMessage);

    return NextResponse.json({ success: true, delivery: deliveryData });

  } catch (err) {
    console.error('Panel delivery error:', err);

    // Update order status ke failed jika delivery gagal
    await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('order_id', (await request.json()).order_id).catch(() => {});

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
      }
