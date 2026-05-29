import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin.from('banners').select('*').eq('is_active', true).order('order_position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banners: data });
}

export async function POST(request) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from('banners').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ banner: data }, { status: 201 });
}

export async function DELETE(request) {
  const { id } = await request.json();
  const { error } = await supabaseAdmin.from('banners').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
