import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { listDroplets, createDroplet, getDroplet, deleteDroplet, listRegions, listSizes } from '@/lib/digitalocean';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, api_key, droplet_id, name, region, size, image } = body;

    if (!api_key) {
      return NextResponse.json({ error: 'API Key diperlukan' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'list':
        result = await listDroplets(api_key);
        break;

      case 'create':
        if (!name) {
          return NextResponse.json({ error: 'Nama droplet diperlukan' }, { status: 400 });
        }
        result = await createDroplet(api_key, { name, region, size, image });
        break;

      case 'get':
        if (!droplet_id) {
          return NextResponse.json({ error: 'Droplet ID diperlukan' }, { status: 400 });
        }
        result = await getDroplet(api_key, droplet_id);
        break;

      case 'delete':
        if (!droplet_id) {
          return NextResponse.json({ error: 'Droplet ID diperlukan' }, { status: 400 });
        }
        result = await deleteDroplet(api_key, droplet_id);
        return NextResponse.json({ success: true, message: 'Droplet dihapus' });

      case 'regions':
        result = await listRegions(api_key);
        break;

      case 'sizes':
        result = await listSizes(api_key);
        break;

      case 'test':
        result = await listDroplets(api_key);
        return NextResponse.json({ success: true, message: 'Koneksi berhasil', droplets_count: result.droplets?.length || 0 });

      default:
        return NextResponse.json({ error: `Action tidak dikenali: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
