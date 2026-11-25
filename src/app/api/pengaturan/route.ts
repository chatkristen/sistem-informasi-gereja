import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';

export async function GET() {
  try {
    const db = readDatabase();
    return NextResponse.json({
      success: true,
      church: db.church,
      stats: {
        total_members: db.members.length,
        total_families: db.families.length,
        total_departments: db.departments.length,
        total_events: db.events.length,
        total_users: db.users.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    const { name, code, address, phone, email, logo_url, actor_name } = body;

    if (name) db.church.name = name;
    if (code) db.church.code = code;
    if (address !== undefined) db.church.address = address;
    if (phone !== undefined) db.church.phone = phone;
    if (email !== undefined) db.church.email = email;
    if (logo_url !== undefined) db.church.logo_url = logo_url;
    db.church.updated_at = new Date().toISOString();

    writeDatabase(db);

    logAudit(
      db.church.id,
      actor_name || 'Admin',
      'UPDATE',
      'PENGATURAN',
      db.church.code,
      {
        nama_gereja: db.church.name,
        telepon: db.church.phone,
        email: db.church.email,
        alamat: db.church.address,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Profil gereja berhasil diperbarui.',
      church: db.church,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
