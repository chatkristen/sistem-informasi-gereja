import { NextResponse } from 'next/server';
import { readDatabase, logAudit } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user_id, user_name } = body;

    const db = readDatabase();

    if (user_name) {
      logAudit(
        db.church.id,
        user_name || 'Pengguna',
        'LOGOUT',
        'AUTENTIKASI',
        user_id || undefined,
        { keterangan: 'Pengguna mengakhiri sesi portal' }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Sesi berhasil diakhiri.',
    });

    // Clear cookie
    response.cookies.set('church_session_token', '', {
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal logout' },
      { status: 500 }
    );
  }
}
