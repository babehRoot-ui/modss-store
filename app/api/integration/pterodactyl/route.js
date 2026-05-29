import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PterodactylAPI } from '@/lib/pterodactyl';
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
    const { action, api_key_id } = body;

    if (!api_key_id) {
      return NextResponse.json({ error: 'api_key_id wajib diisi' }, { status: 400 });
    }

    // Fetch API key dari database
    const { data: keyData, error: keyErr } = await supabaseAdmin.from('api_keys').select('*').eq('id', api_key_id).eq('is_active', true).single();
    if (keyErr || !keyData) {
      return NextResponse.json({ error: 'API Key tidak ditemukan' }, { status: 404 });
    }

    const ptero = new PterodactylAPI(keyData.domain, keyData.api_key, keyData.client_token || '');

    switch (action) {
      case 'list_servers': {
        // Gunakan PLTC (client token) untuk list server
        if (!keyData.client_token) {
          return NextResponse.json({ error: 'PLTC (Client Token) tidak tersedia untuk API key ini' }, { status: 400 });
        }
        const servers = await ptero.clientServers();
        // Fetch resources untuk setiap server
        const serversWithResources = [];
        const serverList = servers?.data || [];
        for (const s of serverList) {
          try {
            const res = await ptero.clientServerResources(s.attributes.identifier);
            serversWithResources.push({
              ...s,
              attributes: {
                ...s.attributes,
                resources: res?.attributes || s.attributes?.resources
              }
            });
          } catch {
            serversWithResources.push(s);
          }
        }
        return NextResponse.json({ servers: serversWithResources });
      }

      case 'list_nodes': {
        const nodes = await ptero.getNodes();
        return NextResponse.json({ nodes });
      }

      case 'list_allocations': {
        const { node_id } = body;
        if (!node_id) return NextResponse.json({ error: 'node_id wajib diisi' }, { status: 400 });
        const allocs = await ptero.getAllocations(node_id);
        return NextResponse.json({ allocations: allocs });
      }

      case 'list_nests': {
        const nests = await ptero.getNests();
        return NextResponse.json({ nests });
      }

      case 'list_eggs': {
        const { nest_id } = body;
        if (!nest_id) return NextResponse.json({ error: 'nest_id wajib diisi' }, { status: 400 });
        const eggs = await ptero.getEggs(nest_id);
        return NextResponse.json({ eggs });
      }

      case 'server_details': {
        const { server_id } = body;
        if (!server_id) return NextResponse.json({ error: 'server_id wajib diisi' }, { status: 400 });
        if (!keyData.client_token) return NextResponse.json({ error: 'PLTC tidak tersedia' }, { status: 400 });
        const details = await ptero.clientServerDetails(server_id);
        return NextResponse.json({ server: details });
      }

      default:
        return NextResponse.json({ error: `Action "${action}" tidak dikenali` }, { status: 400 });
    }

  } catch (err) {
    console.error('Pterodactyl integration error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
