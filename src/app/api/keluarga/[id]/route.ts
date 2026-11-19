import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = readDatabase();
    const family = db.families.find((f) => f.id === id);

    if (!family) {
      return NextResponse.json({ success: false, message: 'Data keluarga tidak ditemukan' }, { status: 404 });
    }

    const members = db.members.filter((m) => m.family_id === family.id);

    // Grouping for Family Tree / Hierarchy Structure
    const head = members.find((m) => m.family_relation === 'KEPALA_KELUARGA') || null;
    const spouse = members.find((m) => m.family_relation === 'ISTRI') || null;
    const children = members.filter((m) => m.family_relation === 'ANAK');
    const others = members.filter(
      (m) => m.family_relation !== 'KEPALA_KELUARGA' && m.family_relation !== 'ISTRI' && m.family_relation !== 'ANAK'
    );

    return NextResponse.json({
      success: true,
      data: {
        ...family,
        members_count: members.length,
        members,
        tree: {
          head,
          spouse,
          children,
          others,
        },
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

    const index = db.families.findIndex((f) => f.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Data keluarga tidak ditemukan' }, { status: 404 });
    }

    const oldFamily = db.families[index];
    const updatedFamily = {
      ...oldFamily,
      ...body,
      updated_at: new Date().toISOString(),
    };

    db.families[index] = updatedFamily;
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Admin', 'UPDATE', 'KELUARGA', updatedFamily.family_number, {
      nama: updatedFamily.family_name,
    });

    return NextResponse.json({ success: true, data: updatedFamily });
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

    const family = db.families.find((f) => f.id === id);
    if (!family) {
      return NextResponse.json({ success: false, message: 'Data keluarga tidak ditemukan' }, { status: 404 });
    }

    family.status = 'ARCHIVED';
    family.updated_at = new Date().toISOString();

    writeDatabase(db);
    logAudit(db.church.id, 'Admin', 'DELETE', 'KELUARGA', family.family_number, {
      action: 'ARCHIVED',
    });

    return NextResponse.json({ success: true, message: 'Keluarga berhasil diarsipkan' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
