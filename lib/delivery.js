import { getOrderByOrderId, getProductById, updateOrder } from '@/lib/supabase';
import { provisionPanelServer } from '@/lib/pterodactyl';
import { createDroplet } from '@/lib/digitalocean';
import { getApiKeys } from '@/lib/supabase';
import { generateDeliveryMessage, sendWhatsApp } from '@/lib/utils';

export async function deliverProduct(orderId) {
  const order = await getOrderByOrderId(orderId);
  if (!order) throw new Error('Order tidak ditemukan');
  if (order.status !== 'paid') throw new Error('Order bukan status paid');

  const product = await getProductById(order.product_id);
  if (!product) throw new Error('Produk tidak ditemukan');

  let deliveryData = {};
  let waLink = '';

  try {
    switch (product.category) {
      case 'panel':
        deliveryData = await deliverPanel(product, order);
        break;
      case 'script':
        deliveryData = await deliverScript(product, order);
        break;
      case 'vps':
        deliveryData = await deliverVps(product, order);
        break;
      default:
        throw new Error('Kategori produk tidak dikenali');
    }

    // Generate WhatsApp link
    const message = generateDeliveryMessage(order, deliveryData);
    waLink = sendWhatsApp(order.customer_phone, message);

    deliveryData.wa_link = waLink;

    // Update order status ke delivered
    await updateOrder(orderId, {
      status: 'delivered',
      delivery_data: deliveryData,
    });

    console.log(`Product delivered for order ${orderId}`);
    return deliveryData;
  } catch (error) {
    console.error(`Delivery error for ${orderId}:`, error);
    throw error;
  }
}

async function deliverPanel(product, order) {
  // Gunakan kredensial dari produk itu sendiri
  const domain = product.panel_domain;
  const plta = product.panel_plta;
  const pltc = product.panel_pltc;

  if (!domain || !plta) {
    throw new Error('Konfigurasi panel tidak lengkap (domain/PLTA kosong)');
  }

  // Buat username unik
  const timestamp = Date.now().toString(36);
  const username = `user_${timestamp}`.substring(0, 12);
  const email = order.customer_email || `${username}@babeh-store.com`;

  try {
    const result = await provisionPanelServer({
      domain,
      plta,
      pltc,
      customerEmail: email,
      customerName: order.customer_name || username,
      eggId: product.type || null, // Bisa dioverride
      nestId: 1,
      nodeId: 1,
      memory: 1024,
      disk: 10240,
      cpu: 100,
    });

    return {
      panel_url: result.panel_url,
      username: result.username,
      email: result.email,
      server_id: result.server_id,
      server_name: result.server?.name || null,
    };
  } catch (error) {
    console.error('Panel provisioning failed:', error);
    // Fallback: kirim info panel tanpa provisioning
    return {
      panel_url: domain,
      username: 'Silakan hubungi admin',
      email: email,
      note: 'Auto-provisioning gagal, admin akan membuatkan server manual',
      error: error.message,
    };
  }
}

async function deliverScript(product, order) {
  if (!product.file_url) {
    throw new Error('File URL tidak tersedia untuk produk ini');
  }

  return {
    file_url: product.file_url,
    product_name: product.name,
    instructions: 'Download file, extract, dan baca README.txt',
  };
}

async function deliverVps(product, order) {
  // Ambil DO API Key dari tabel api_keys
  const doKeys = await getApiKeys('do');
  if (doKeys.length === 0) {
    throw new Error('DigitalOcean API Key tidak tersedia');
  }

  const apiKey = doKeys[0].api_key;
  const serverName = `${order.customer_name || 'vps'}-${Date.now().toString(36)}`;

  try {
    // Parse type untuk size/region
    let size = 's-1vcpu-1gb';
    let region = 'sgp1';
    if (product.type) {
      const parts = product.type.toLowerCase().split(/[\s,]+/);
      if (parts.includes('2gb')) size = 's-1vcpu-2gb';
      if (parts.includes('4gb')) size = 's-2vcpu-4gb';
      if (parts.includes('jakarta') || parts.includes('jkt')) region = 'sgp1';
    }

    const result = await createDroplet(apiKey, {
      name: serverName,
      region,
      size,
      image: 'ubuntu-22-04-x64',
    });

    const droplet = result.droplet;
    if (!droplet) {
      throw new Error('Gagal membuat droplet');
    }

    // Tunggu beberapa detik untuk IP assignment
    let ip = droplet.networks?.v4?.[0]?.ip_address;
    if (!ip) {
      // Poll untuk dapat IP (max 30 detik)
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const { listDroplets } = await import('@/lib/digitalocean');
        const droplets = await listDroplets(apiKey);
        const found = droplets.droplets?.find(d => d.id === droplet.id);
        if (found?.networks?.v4?.[0]?.ip_address) {
          ip = found.networks.v4[0].ip_address;
          break;
        }
      }
    }

    // Generate password (DO menggunakan SSH key, tapi kita kirim info dasar)
    const password = `Babeh${Date.now().toString(36)}!`;

    return {
      ip: ip || 'Sedang diproses',
      username: 'root',
      password: 'Cek email untuk credentials',
      region: region,
      size: size,
      droplet_id: droplet.id,
      name: serverName,
      note: ip
        ? 'SSH login: ssh root@' + ip
        : 'IP sedang diproses, cek kembali dalam beberapa menit',
    };
  } catch (error) {
    console.error('VPS provisioning failed:', error);
    throw new Error(`Gagal membuat VPS: ${error.message}`);
  }
      }
