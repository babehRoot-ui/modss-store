import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { pteroRequest, getNests, getEggs, getNodes, getPterodactylServers, getServerResources } from '@/lib/pterodactyl';

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, domain, api_key, client_token, nest_id, server_id } = body;

    if (!domain || !api_key) {
      return NextResponse.json({ error: 'Domain dan API Key wajib diisi' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'servers':
        // Pakai client_token untuk list server client
        if (!client_token) {
          return NextResponse.json({ error: 'Client Token (PLTC) diperlukan' }, { status: 400 });
        }
        result = await getPterodactylServers(domain, client_token);
        break;

      case 'server_resources':
        if (!client_token || !server_id) {
          return NextResponse.json({ error: 'Client Token dan Server ID diperlukan' }, { status: 400 });
        }
        result = await getServerResources(domain, client_token, server_id);
        break;

      case 'nests':
        result = await getNests(domain, api_key);
        break;

      case 'eggs':
        if (!nest_id) {
          return NextResponse.json({ error: 'Nest ID diperlukan' }, { status: 400 });
        }
        result = await getEggs(domain, api_key, nest_id);
        break;

      case 'nodes':
        result = await getNodes(domain, api_key);
        break;

      case 'test':
        // Test connection
        if (client_token) {
          result = await pteroRequest(domain, client_token, '/client');
        } else {
          result = await pteroRequest(domain, api_key, '/application/servers?per_page=1');
        }
        return NextResponse.json({ success: true, message: 'Koneksi berhasil', data: result });

      default:
        return NextResponse.json({ error: `Action tidak dikenali: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
