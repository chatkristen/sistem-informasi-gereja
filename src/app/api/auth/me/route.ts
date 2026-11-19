import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = readDatabase();
    
    // Return sanitized users for quick testing & demo cards
    const demoUsers = db.users.map((u) => ({
      id: u.id,
      church_id: u.church_id,
      role_code: u.role_code,
      role_name: u.role_name,
      department_id: u.department_id,
      department_name: u.department_name,
      username: u.username,
      email: u.email,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      status: u.status,
      default_password: 'password123',
    }));

    return NextResponse.json({
      success: true,
      church: {
        id: db.church.id,
        name: db.church.name,
        code: db.church.code,
        address: db.church.address,
        phone: db.church.phone,
        email: db.church.email,
      },
      users: demoUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
