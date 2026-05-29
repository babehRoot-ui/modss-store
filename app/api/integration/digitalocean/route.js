import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DigitalOceanAPI } from '@/lib/digitalocean';
import { verifySessionToken } from '@/lib/auth';

async function checkAuth(request) {
  const token = request.cookies.get('admin_session')?.value;
  return token && verifySessionToken(token);
}

export async function POST(request) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Ambil DO API Key dari database
    const { data: doKeys, error: keyErr } = await supabaseAdmin.from('api_keys').select('*').eq('type', 'do').eq('is_active', true);
    if (keyErr || !doKeys || doKeys.length === 0) {
      return NextResponse.json({ error: 'DigitalOcean API Key tidak ditemukan. Tambahkan di menu API Keys.' }, { status: 404 });
    }

    // Jika ada api_key_id spesifik, gunakan itu
    let apiKeyData = doKeys[0];
    if (body.api_key_id) {
      const found = doKeys.find(k => k.id === body.api_key_id);
      if (found) apiKeyData = found;
    }

    const doApi = new DigitalOceanAPI(apiKeyData.api_key);

    switch (action) {
      case 'list_droplets': {
        const result = await doApi.listDroplets();
        return NextResponse.json({ droplets: result?.droplets || [] });
      }

      case 'create_droplet': {
        const { name, region, size, image } = body;
        if (!name) return NextResponse.json({ error: 'Nama droplet wajib diisi' }, { status: 400 });
        const result = await doApi.createDroplet({ name, region, size, image });
        return NextResponse.json({ droplet: result?.droplet, root_password: result?.root_password });
      }

      case 'get_droplet': {
        const { droplet_id } = body;
        if (!droplet_id) return NextResponse.json({ error: 'droplet_id wajib diisi' }, { status: 400 });
        const result = await doApi.getDroplet(droplet_id);
        return NextResponse.json({ droplet: result?.droplet });
      }

      case 'list_regions': {
        // Hardcoded list region DO yang populer
        const regions = [
          { slug: 'sgp1', name: 'Singapore 1' },
          { slug: 'sgp2', name: 'Singapore 2' },
          { slug: 'sgp3', name: 'Singapore 3' },
          { slug: 'jak1', name: 'Jakarta 1' },
          { slug: 'nyc1', name: 'New York 1' },
          { slug: 'nyc3', name: 'New York 3' },
          { slug: 'sfo3', name: 'San Francisco 3' },
          { slug: 'ams3', name: 'Amsterdam 3' },
          { slug: 'fra1', name: 'Frankfurt 1' },
          { slug: 'tok1', name: 'Tokyo 1' },
          { slug: 'syd1', name: 'Sydney 1' }
        ];
        return NextResponse.json({ regions });
      }

      case 'list_sizes': {
        const sizes = [
          { slug: 's-1vcpu-1gb', name: '1 vCPU - 1GB RAM - $6/mo', vcpus: 1, memory: 1024, disk: 25 },
          { slug: 's-1vcpu-2gb', name: '1 vCPU - 2GB RAM - $12/mo', vcpus: 1, memory: 2048, disk: 50 },
          { slug: 's-2vcpu-2gb', name: '2 vCPU - 2GB RAM - $18/mo', vcpus: 2, memory: 2048, disk: 60 },
          { slug: 's-2vcpu-4gb', name: '2 vCPU - 4GB RAM - $24/mo', vcpus: 2, memory: 4096, disk: 80 },
          { slug: 's-4vcpu-8gb', name: '4 vCPU - 8GB RAM - $48/mo', vcpus: 4, memory: 8192, disk: 160 },
          { slug: 's-6vcpu-16gb', name: '6 vCPU - 16GB RAM - $96/mo', vcpus: 6, memory: 16384, disk: 320 },
          { slug: 's-8vcpu-32gb', name: '8 vCPU - 32GB RAM - $192/mo', vcpus: 8, memory: 32768, disk: 640 }
        ];
        return NextResponse.json({ sizes });
      }

      default:
        return NextResponse.json({ error: `Action "${action}" tidak dikenali` }, { status: 400 });
    }

  } catch (err) {
    console.error('DigitalOcean integration error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
