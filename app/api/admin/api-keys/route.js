import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifySessionToken } from '@/lib/auth';

// Middleware sederhana - cek session
async function checkAuth(request) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token || !verifySessionToken(token)) {
    return false;
  }
  return true;
}

export async function GET(request) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.from('api_keys').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data });
}

export async function POST(request) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, name, api_key, client_token, domain, config } = body;

    if (!name || !api_key || !type) {
      return NextResponse.json({ error: 'Name, API Key, dan Type wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('api_keys').insert({
      type,
      name,
      api_key,
      client_token: client_token || null,
      domain: domain || null,
      config: config || {}
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ key: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

    const { error } = await supabaseAdmin.from('api_keys').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
