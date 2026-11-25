import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { Announcement } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const audience = searchParams.get('audience');

    const db = readDatabase();
    let announcements = [...db.announcements];

    if (audience && audience !== 'ALL') {
      announcements = announcements.filter(
        (a) => a.target_audience === audience || a.target_audience === 'ALL'
      );
    }

    return NextResponse.json({ success: true, data: announcements });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    const dept = body.department_id
      ? db.departments.find((d) => d.id === body.department_id)
      : null;

    const newAnnouncement: Announcement = {
      id: 'anc-' + Date.now(),
      church_id: db.church.id,
      title: body.title,
      content: body.content,
      attachment_url: body.attachment_url || undefined,
      target_audience: body.target_audience || 'ALL',
      department_id: body.department_id || undefined,
      department_name: dept?.name,
      publish_date: body.publish_date || new Date().toISOString().split('T')[0],
      status: body.status || 'PUBLISHED',
      created_by_name: body.actor_name || 'Sekretariat',
      created_at: new Date().toISOString(),
    };

    db.announcements.unshift(newAnnouncement);
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Sekretariat', 'CREATE', 'PENGUMUMAN', newAnnouncement.id, {
      judul: newAnnouncement.title,
      target: newAnnouncement.target_audience,
    });

    return NextResponse.json({ success: true, data: newAnnouncement });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = readDatabase();
    const index = db.announcements.findIndex((a) => a.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Warta pengumuman tidak ditemukan' }, { status: 404 });
    }

    const removed = db.announcements.splice(index, 1)[0];
    writeDatabase(db);

    logAudit(db.church.id, 'Sekretariat', 'DELETE', 'PENGUMUMAN', removed.id, {
      judul: removed.title,
    });

    return NextResponse.json({ success: true, message: 'Warta pengumuman berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
