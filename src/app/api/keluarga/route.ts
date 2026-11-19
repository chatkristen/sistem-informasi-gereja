import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { Family } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    const db = readDatabase();
    let families = [...db.families];

    if (search) {
      families = families.filter(
        (f) =>
          f.family_name.toLowerCase().includes(search) ||
          f.family_number.toLowerCase().includes(search) ||
          f.head_member_name?.toLowerCase().includes(search) ||
          f.phone.toLowerCase().includes(search)
      );
    }

    // Attach family members to each family
    const enriched = families.map((fam) => {
      const members = db.members.filter((m) => m.family_id === fam.id);
      return {
        ...fam,
        members_count: members.length,
        members,
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

    const currentYear = new Date().getFullYear();
    const count = db.families.length + 1;
    const familyNumber = `KK-${currentYear}-${String(count).padStart(4, '0')}`;

    const headMember = body.head_member_id
      ? db.members.find((m) => m.id === body.head_member_id)
      : null;
    const spouseMember = body.spouse_member_id
      ? db.members.find((m) => m.id === body.spouse_member_id)
      : null;

    const newFamily: Family = {
      id: 'f-' + Date.now(),
      church_id: db.church.id,
      family_number: familyNumber,
      family_name: body.family_name || `Keluarga ${headMember?.full_name || 'Jemaat'}`,
      head_member_id: body.head_member_id || undefined,
      head_member_name: headMember?.full_name || body.head_member_name,
      spouse_member_id: body.spouse_member_id || undefined,
      spouse_member_name: spouseMember?.full_name || body.spouse_member_name,
      address: body.address || headMember?.address || '',
      phone: body.phone || headMember?.phone || '',
      rt_rw: body.rt_rw || '',
      city: body.city || 'Jakarta Pusat',
      postal_code: body.postal_code || '',
      status: 'ACTIVE',
      members_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.families.push(newFamily);

    // If head & spouse are existing members, link them
    if (headMember) {
      headMember.family_id = newFamily.id;
      headMember.family_relation = 'KEPALA_KELUARGA';
      newFamily.members_count = (newFamily.members_count || 0) + 1;
    }
    if (spouseMember) {
      spouseMember.family_id = newFamily.id;
      spouseMember.family_relation = 'ISTRI';
      newFamily.members_count = (newFamily.members_count || 0) + 1;
    }

    writeDatabase(db);
    logAudit(db.church.id, body.actor_name || 'Admin', 'CREATE', 'KELUARGA', newFamily.family_number, {
      nama: newFamily.family_name,
    });

    return NextResponse.json({ success: true, data: newFamily });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
