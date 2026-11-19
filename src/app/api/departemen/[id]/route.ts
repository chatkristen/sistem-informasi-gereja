import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { DepartmentMember } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = readDatabase();
    const department = db.departments.find((d) => d.id === id);

    if (!department) {
      return NextResponse.json({ success: false, message: 'Departemen tidak ditemukan' }, { status: 404 });
    }

    const members = db.department_members
      .filter((dm) => dm.department_id === id)
      .map((dm) => {
        const memberInfo = db.members.find((m) => m.id === dm.member_id);
        return {
          ...dm,
          member_name: memberInfo?.full_name || dm.member_name,
          member_number: memberInfo?.member_number || dm.member_number,
          phone: memberInfo?.phone,
          photo_url: memberInfo?.photo_url,
        };
      });

    const workPrograms = db.work_programs.filter((wp) => wp.department_id === id);
    const events = db.events.filter((e) => e.department_id === id);

    return NextResponse.json({
      success: true,
      data: {
        ...department,
        members,
        workPrograms,
        events,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Assign member to department (Many-to-many relationship)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { member_id, position_name, notes, actor_name } = body;

    const db = readDatabase();
    const department = db.departments.find((d) => d.id === id);
    const member = db.members.find((m) => m.id === member_id);

    if (!department || !member) {
      return NextResponse.json({ success: false, message: 'Departemen atau Jemaat tidak valid' }, { status: 400 });
    }

    // Check if already in this department
    const existing = db.department_members.find(
      (dm) => dm.department_id === id && dm.member_id === member_id
    );

    if (existing) {
      existing.position_name = position_name || existing.position_name;
      existing.notes = notes || existing.notes;
      existing.status = 'ACTIVE';
      writeDatabase(db);
      return NextResponse.json({ success: true, message: 'Keanggotaan komisi diperbarui', data: existing });
    }

    const newEnrollment: DepartmentMember = {
      id: 'dm-' + Date.now(),
      department_id: id,
      department_name: department.name,
      member_id: member.id,
      member_name: member.full_name,
      member_number: member.member_number,
      position_name: position_name || 'Anggota',
      joined_at: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      notes,
    };

    db.department_members.push(newEnrollment);
    writeDatabase(db);

    logAudit(db.church.id, actor_name || 'Admin', 'CREATE', 'DEPARTEMEN', department.name, {
      aksi: 'ASSIGN_MEMBER',
      jemaat: member.full_name,
      jabatan: newEnrollment.position_name,
    });

    return NextResponse.json({ success: true, data: newEnrollment });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Remove member from department
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    const db = readDatabase();
    const index = db.department_members.findIndex(
      (dm) => dm.department_id === id && dm.member_id === memberId
    );

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Data keanggotaan tidak ditemukan' }, { status: 404 });
    }

    const removed = db.department_members.splice(index, 1)[0];
    writeDatabase(db);

    logAudit(db.church.id, 'Admin', 'DELETE', 'DEPARTEMEN', id, {
      aksi: 'REMOVE_MEMBER',
      member_id: memberId,
    });

    return NextResponse.json({ success: true, message: 'Anggota berhasil dikeluarkan dari komisi', data: removed });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
