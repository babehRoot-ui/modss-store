import { NextResponse } from 'next/server';
import { verifyAdmin, createSessionToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    if (!verifyAdmin(username, password)) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 });
    }

    const token = createSessionToken();

    // Set cookie yang aman
    const response = NextResponse.json({ success: true, message: 'Login berhasil' });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 jam
      path: '/'
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
