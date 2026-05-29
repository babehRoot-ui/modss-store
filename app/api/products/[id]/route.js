import { NextResponse } from 'next/server';
import { updateProduct, deleteProduct, getProductById } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const product = await getProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates = {};

    // Hanya izinkan field tertentu
    const allowedFields = ['name', 'description', 'price', 'category', 'type', 'stock', 'file_url', 'image_url', 'badge', 'panel_domain', 'panel_plta', 'panel_pltc', 'is_active'];
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = key === 'price' || key === 'stock' ? parseInt(body[key]) : body[key];
      }
    }

    // Jika category bukan panel, hapus field panel
    if (updates.category && updates.category !== 'panel') {
      updates.panel_domain = null;
      updates.panel_plta = null;
      updates.panel_pltc = null;
    }

    const product = await updateProduct(params.id, updates);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteProduct(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
