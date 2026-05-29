import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PterodactylAPI } from '@/lib/pterodactyl';
import { sendWhatsApp } from '@/lib/utils';

export async function POST(request) {
  try {
    const { order_id } = await request.json();

    // Fetch order + product
    const { data: order } = await supabaseAdmin.from('orders').select('*').eq('order_id', order_id).single();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', order.product_id).single();
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (!product.panel_domain || !product.panel_plta) {
      throw new Error('Produk panel tidak memiliki konfigurasi lengkap (domain/PLTA)');
    }

    const ptero = new PterodactylAPI(product.panel_domain, product.panel_plta, product.panel_pltc || '');
    const config = product.config || {};
    const password = ptero.genPassword();
    const username = `user_${Date.now().toString(36)}`;
    const email = `${username}@babeh-store.com`;

    // 1. Buat user
    const userResult = await ptero.createUser(email, username, order.customer_name || 'Customer', '');
    const userId = userResult?.attributes?.id;
    const userPassword = password; // Password dari createUser atau yang kita generate

    // 2. Dapatkan allocation
    let allocationId = config.allocation_id;
    if (!allocationId && config.node_id) {
      const allocs = await ptero.getAllocations(config.node_id);
      const freeAlloc = allocs?.data?.find(a => !a.attributes?.assigned);
      if (!freeAlloc) throw new Error('Tidak ada allocation tersedia di node ini');
      allocationId = freeAlloc.attributes.id;
    }
    if (!allocationId) throw new Error('Allocation ID tidak ditemukan. Set di config produk atau pastikan ada allocation free.');

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
      password: userPassword,
      email,
      panel_url: product.panel_domain,
      message: 'Server panel berhasil dibuat!'
    };

    // Update order
    await supabaseAdmin.from('orders').update({ status: 'delivered', delivery_data: deliveryData }).eq('order_id', order_id);
