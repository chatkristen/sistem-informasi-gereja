import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { ChurchEvent } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const departmentId = searchParams.get('department_id');
    const status = searchParams.get('status');

    const db = readDatabase();
    let events = [...db.events];

    if (category) {
      events = events.filter((e) => e.category === category);
    }
    if (departmentId) {
      events = events.filter((e) => e.department_id === departmentId);
    }
    if (status) {
      events = events.filter((e) => e.status === status);
    }

    // Sort by start_time ascending
    events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return NextResponse.json({ success: true, data: events });
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
    const pic = body.pic_member_id
      ? db.members.find((m) => m.id === body.pic_member_id)
      : null;
    const mc = body.mc_member_id
      ? db.members.find((m) => m.id === body.mc_member_id)
      : null;

    const newEvent: ChurchEvent = {
      id: 'ev-' + Date.now(),
      church_id: db.church.id,
      work_program_id: body.work_program_id || undefined,
      department_id: body.department_id || undefined,
      department_name: dept?.name,
      title: body.title,
      category: body.category || 'IBADAH_RAYA',
      start_time: body.start_time,
      end_time: body.end_time || undefined,
      location: body.location || 'Sanctuary Gedung Utama',
      pic_member_id: body.pic_member_id || undefined,
      pic_member_name: pic?.full_name || body.pic_member_name,
      mc_member_id: body.mc_member_id || undefined,
      mc_name: mc?.full_name || body.mc_name || undefined,
      singers: Array.isArray(body.singers)
        ? body.singers.filter((s: string) => s && s.trim())
        : undefined,
      musicians: Array.isArray(body.musicians)
        ? body.musicians.filter((s: string) => s && s.trim())
        : undefined,
      offering_officers: Array.isArray(body.offering_officers)
        ? body.offering_officers.filter((s: string) => s && s.trim())
        : undefined,
      ushers: Array.isArray(body.ushers)
        ? body.ushers.filter((s: string) => s && s.trim())
        : undefined,
      multimedia_officers: Array.isArray(body.multimedia_officers)
        ? body.multimedia_officers.filter((s: string) => s && s.trim())
        : body.multimedia_officers
        ? [body.multimedia_officers]
        : undefined,
      sound_officers: Array.isArray(body.sound_officers)
        ? body.sound_officers.filter((s: string) => s && s.trim())
        : body.sound_officers
        ? [body.sound_officers]
        : undefined,
      budget: Number(body.budget) || 0,
      description: body.description || '',
      status: body.status || 'SCHEDULED',
      created_at: new Date().toISOString(),
    };

    db.events.push(newEvent);
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Sekretariat', 'CREATE', 'KEGIATAN', newEvent.title, {
      jadwal: newEvent.start_time,
      lokasi: newEvent.location,
    });

    return NextResponse.json({ success: true, data: newEvent });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const db = readDatabase();
    const event = db.events.find((e) => e.id === id);

    if (!event) {
      return NextResponse.json({ success: false, message: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    Object.assign(event, updates);
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Sekretariat', 'UPDATE', 'KEGIATAN', event.title, {
      status: event.status,
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = readDatabase();
    const index = db.events.findIndex((e) => e.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    const removed = db.events.splice(index, 1)[0];
    writeDatabase(db);

    logAudit(db.church.id, 'Sekretariat', 'DELETE', 'KEGIATAN', removed.title, {
      aksi: 'BATAL_HAPUS',
    });

    return NextResponse.json({ success: true, message: 'Kegiatan berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
