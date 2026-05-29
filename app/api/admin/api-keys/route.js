import { NextResponse } from 'next/server';
import { getApiKeys, createApiKey, deleteApiKey } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || null;
    const keys = await getApiKeys(type);
    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, name, api_key, client_token, domain } = body;

    if (!type || !api_key) {
      return NextResponse.json({ error: 'Type dan API Key wajib diisi' }, { status: 400 });
    }

    if (!['do', 'pterodactyl'].includes(type)) {
      return NextResponse.json({ error: 'Type tidak valid (do/pterodactyl)' }, { status: 400 });
    }

    const key = await createApiKey({
      type,
      name: name || type,
      api_key,
      client_token: type === 'pterodactyl' ? (client_token || null) : null,
      domain: type === 'pterodactyl' ? (domain || null) : null,
      is_active: true,
    });

    return NextResponse.json(key, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    }

    await deleteApiKey(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
