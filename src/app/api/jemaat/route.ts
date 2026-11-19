import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { Member } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || '';
    const gender = searchParams.get('gender') || '';
    const familyId = searchParams.get('family_id') || '';
    const role = searchParams.get('role') || 'SUPER_ADMIN';

    const db = readDatabase();
    let members = [...db.members];

    // Filter by search (name, number, phone, email)
    if (search) {
      members = members.filter(
        (m) =>
          m.full_name.toLowerCase().includes(search) ||
          m.member_number.toLowerCase().includes(search) ||
          m.phone.toLowerCase().includes(search) ||
          m.email.toLowerCase().includes(search)
      );
    }

    // Filter by status
    if (status) {
      members = members.filter((m) => m.status === status);
    }

    // Filter by gender
    if (gender) {
      members = members.filter((m) => m.gender === gender);
    }

    // Filter by family
    if (familyId) {
      members = members.filter((m) => m.family_id === familyId);
    }

    // Attach department briefs & family info
    const enriched = members.map((m) => {
      const depts = db.department_members
        .filter((dm) => dm.member_id === m.id)
        .map((dm) => {
          const dept = db.departments.find((d) => d.id === dm.department_id);
          return {
            department_id: dm.department_id,
            department_name: dept?.name || 'Komisi',
            position_name: dm.position_name || 'Anggota',
            joined_at: dm.joined_at,
            status: dm.status,
          };
        });

      const family = m.family_id ? db.families.find((f) => f.id === m.family_id) : undefined;

      // Restrict confidential notes if not Super Admin or Pendeta
      const canViewPastoral = role === 'SUPER_ADMIN' || role === 'PENDETA';
      const notes = m.is_confidential_notes && !canViewPastoral ? '[Catatan pastoral dilindungi]' : m.notes;

      return {
        ...m,
        notes,
        family_name: family?.family_name,
        family_number: family?.family_number,
        departments: depts,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
      total: enriched.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    // Generate unique member number JMT-2026-XXXX
    const currentYear = new Date().getFullYear();
    const count = db.members.length + 1;
    const memberNumber = `JMT-${currentYear}-${String(count).padStart(4, '0')}`;

    const newMember: Member = {
      id: 'm-' + Date.now(),
      church_id: db.church.id,
      family_id: body.family_id || undefined,
      member_number: memberNumber,
      full_name: body.full_name,
      gender: body.gender || 'L',
      pob: body.pob || '',
      dob: body.dob || '',
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      join_date: body.join_date || new Date().toISOString().split('T')[0],
      status: body.status || 'ACTIVE',
      occupation: body.occupation || '',
      education: body.education || '',
      family_relation: body.family_relation || 'KEPALA_KELUARGA',
      photo_url: body.photo_url || `https://images.unsplash.com/photo-${body.gender === 'P' ? '1544005313-94ddf0286df2' : '1507003211169-0a1dd7228f2d'}?w=150`,
      notes: body.notes || '',
      is_confidential_notes: Boolean(body.is_confidential_notes),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.members.push(newMember);

    // If family is chosen, update family members count
    if (newMember.family_id) {
      const fam = db.families.find((f) => f.id === newMember.family_id);
      if (fam) {
        fam.members_count = (fam.members_count || 0) + 1;
      }
    }

    writeDatabase(db);
    logAudit(db.church.id, body.actor_name || 'Admin', 'CREATE', 'JEMAAT', newMember.member_number, {
      nama: newMember.full_name,
    });

    return NextResponse.json({ success: true, data: newMember });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
