import { NextResponse } from 'next/server';
import { getOrderByOrderId } from '@/lib/supabase';

export async function GET(request, { params }) {
  try {
    const order = await getOrderByOrderId(params.order_id);
    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
