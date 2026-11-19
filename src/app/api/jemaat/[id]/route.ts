import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = readDatabase();
    const member = db.members.find((m) => m.id === id);

    if (!member) {
      return NextResponse.json({ success: false, message: 'Data jemaat tidak ditemukan' }, { status: 404 });
    }

    // Attach family info & family members
    let family = null;
    let familyMembers: any[] = [];
    if (member.family_id) {
      family = db.families.find((f) => f.id === member.family_id) || null;
      familyMembers = db.members.filter((m) => m.family_id === member.family_id);
    }

    // Attach department memberships
    const departmentMemberships = db.department_members
      .filter((dm) => dm.member_id === member.id)
      .map((dm) => {
        const dept = db.departments.find((d) => d.id === dm.department_id);
        return {
          ...dm,
          department_name: dept?.name || 'Komisi',
          category: dept?.category,
        };
      });

    // Attach offering / tithe history (if user has access)
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'SUPER_ADMIN';
    const canSeeOfferings = role === 'SUPER_ADMIN' || role === 'BENDAHARA';

    const offerings = canSeeOfferings
      ? db.financial_transactions.filter((tx) => tx.member_id === member.id)
      : [];

    return NextResponse.json({
      success: true,
      data: {
        ...member,
        family,
        familyMembers,
        departmentMemberships,
        offerings,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const db = readDatabase();

    const index = db.members.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Data jemaat tidak ditemukan' }, { status: 404 });
    }

    const oldMember = db.members[index];
    const updatedMember = {
      ...oldMember,
      ...body,
      updated_at: new Date().toISOString(),
    };

    db.members[index] = updatedMember;
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Admin', 'UPDATE', 'JEMAAT', updatedMember.member_number, {
      nama: updatedMember.full_name,
      status: updatedMember.status,
    });

    return NextResponse.json({ success: true, data: updatedMember });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = readDatabase();

    const member = db.members.find((m) => m.id === id);
    if (!member) {
      return NextResponse.json({ success: false, message: 'Data jemaat tidak ditemukan' }, { status: 404 });
    }

    // Soft delete / archive to maintain relational integrity
    member.status = 'INACTIVE';
    member.updated_at = new Date().toISOString();

    writeDatabase(db);
    logAudit(db.church.id, 'Admin', 'DELETE', 'JEMAAT', member.member_number, {
      action: 'ARCHIVED',
      nama: member.full_name,
    });

    return NextResponse.json({ success: true, message: 'Data jemaat berhasil dinonaktifkan/diarsipkan' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
