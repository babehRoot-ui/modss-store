import { NextResponse } from 'next/server';
import { getActiveProducts, getAllProducts, createProduct } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin');

    if (admin === 'true') {
      // Admin: get all products including inactive
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token || !verifyAdminToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const products = await getAllProducts();
      return NextResponse.json(products);
    }

    // Public: only active products
    const products = await getActiveProducts();
    return NextResponse.json(products);
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
    const { name, description, price, category, type, stock, file_url, image_url, badge, panel_domain, panel_plta, panel_pltc } = body;

    if (!name || !price || !category) {
      return NextResponse.json({ error: 'Name, price, dan category wajib diisi' }, { status: 400 });
    }

    if (!['panel', 'script', 'vps'].includes(category)) {
      return NextResponse.json({ error: 'Category tidak valid' }, { status: 400 });
    }

    const product = await createProduct({
      name,
      description: description || null,
      price: parseInt(price),
      category,
      type: type || null,
      stock: parseInt(stock) || 999,
      file_url: file_url || null,
      image_url: image_url || null,
      badge: badge || null,
      panel_domain: category === 'panel' ? (panel_domain || null) : null,
      panel_plta: category === 'panel' ? (panel_plta || null) : null,
      panel_pltc: category === 'panel' ? (panel_pltc || null) : null,
      is_active: true,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
