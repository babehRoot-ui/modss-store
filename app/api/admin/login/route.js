import { NextResponse } from 'next/server';
import { verifyAdmin, generateAdminToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    if (!verifyAdmin(username, password)) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    const token = generateAdminToken();

    return NextResponse.json({
      success: true,
      token,
      user: username,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
