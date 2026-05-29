import { NextResponse } from 'next/server';
import { getBanners, getAllBanners, createBanner, deleteBanner } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin');

    if (admin === 'true') {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token || !verifyAdminToken(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const banners = await getAllBanners();
      return NextResponse.json(banners);
    }

    const banners = await getBanners();
    return NextResponse.json(banners);
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
    const banner = await createBanner({
      image_url: body.image_url,
      title: body.title || null,
      link: body.link || null,
      order_position: parseInt(body.order_position) || 0,
      is_active: true,
    });

    return NextResponse.json(banner, { status: 201 });
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
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await deleteBanner(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
