import { NextResponse } from 'next/server';
import { deliverProduct } from '@/lib/delivery';

export async function POST(request) {
  try {
    const { order_id } = await request.json();
    if (!order_id) {
      return NextResponse.json({ error: 'Order ID diperlukan' }, { status: 400 });
    }

    const result = await deliverProduct(order_id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
