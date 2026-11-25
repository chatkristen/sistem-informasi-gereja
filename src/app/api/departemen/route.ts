import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { Department } from '@/lib/types';

export async function GET() {
  try {
    const db = readDatabase();
    const enriched = db.departments.map((dept) => {
      const activeMembers = db.department_members.filter(
        (dm) => dm.department_id === dept.id && dm.status === 'ACTIVE'
      );
      const leader = dept.leader_member_id
        ? db.members.find((m) => m.id === dept.leader_member_id)
        : null;

      return {
        ...dept,
        members_count: activeMembers.length,
        leader_member_name: leader?.full_name || dept.leader_member_name,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    const newDept: Department = {
      id: 'd-' + Date.now(),
      church_id: db.church.id,
      code: body.code.toUpperCase(),
      name: body.name,
      description: body.description || '',
      category: body.category || 'KOMISI',
      leader_member_id: body.leader_member_id || undefined,
      leader_member_name: body.leader_member_name || undefined,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.departments.push(newDept);
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Admin', 'CREATE', 'DEPARTEMEN', newDept.code, {
      nama: newDept.name,
    });

    return NextResponse.json({ success: true, data: newDept });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = readDatabase();
    const index = db.departments.findIndex((d) => d.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Departemen tidak ditemukan' }, { status: 404 });
    }

    const removed = db.departments.splice(index, 1)[0];
    writeDatabase(db);

    logAudit(db.church.id, 'Admin', 'DELETE', 'DEPARTEMEN', removed.name, {
      kode: removed.code,
    });

    return NextResponse.json({ success: true, message: 'Departemen berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
