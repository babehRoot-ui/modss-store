import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request, { params }) {
  const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', params.id).single();
  if (error) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PUT(request, { params }) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from('products').update(body).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

export async function DELETE(request, { params }) {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
