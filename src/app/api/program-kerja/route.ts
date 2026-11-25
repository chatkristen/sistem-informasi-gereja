import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { WorkProgram } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id');
    const status = searchParams.get('status');
    const year = searchParams.get('year');

    const db = readDatabase();
    let programs = [...db.work_programs];

    if (departmentId) {
      programs = programs.filter((p) => p.department_id === departmentId);
    }
    if (status) {
      programs = programs.filter((p) => p.status === status);
    }
    if (year) {
      programs = programs.filter((p) => p.year === Number(year));
    }

    return NextResponse.json({ success: true, data: programs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    const dept = db.departments.find((d) => d.id === body.department_id);
    const pic = body.pic_member_id
      ? db.members.find((m) => m.id === body.pic_member_id)
      : null;

    const newProgram: WorkProgram = {
      id: 'wp-' + Date.now(),
      church_id: db.church.id,
      department_id: body.department_id,
      department_name: dept?.name || 'Komisi',
      title: body.title,
      description: body.description || '',
      target_audience: body.target_audience || 'Jemaat',
      pic_member_id: body.pic_member_id || undefined,
      pic_member_name: pic?.full_name || body.pic_member_name,
      period_type: body.period_type || 'ANNUAL',
      year: Number(body.year) || 2026,
      month: body.month ? Number(body.month) : undefined,
      budget_allocated: Number(body.budget_allocated) || 0,
      budget_spent: 0,
      status: body.status || 'DRAFT',
      results: body.results || '',
      created_by: body.created_by || 'u1',
      created_at: new Date().toISOString(),
    };

    db.work_programs.push(newProgram);
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Ketua Komisi', 'CREATE', 'PROGRAM_KERJA', newProgram.id, {
      program: newProgram.title,
      komisi: newProgram.department_name,
      anggaran: newProgram.budget_allocated,
    });

    return NextResponse.json({ success: true, data: newProgram });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, results, budget_spent, budget_allocated, actor_name } = body;

    const db = readDatabase();
    const program = db.work_programs.find((p) => p.id === id);

    if (!program) {
      return NextResponse.json({ success: false, message: 'Program kerja tidak ditemukan' }, { status: 404 });
    }

    if (status) program.status = status;
    if (results !== undefined) program.results = results;
    if (budget_spent !== undefined) program.budget_spent = Number(budget_spent);
    if (budget_allocated !== undefined) program.budget_allocated = Number(budget_allocated);

    writeDatabase(db);
    logAudit(db.church.id, actor_name || 'Admin', 'UPDATE', 'PROGRAM_KERJA', program.title, {
      status_baru: program.status,
    });

    return NextResponse.json({ success: true, data: program });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = readDatabase();
    const index = db.work_programs.findIndex((p) => p.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Program kerja tidak ditemukan' }, { status: 404 });
    }

    const removed = db.work_programs.splice(index, 1)[0];
    writeDatabase(db);

    logAudit(db.church.id, 'Admin', 'DELETE', 'PROGRAM_KERJA', removed.title, {
      komisi: removed.department_name,
    });

    return NextResponse.json({ success: true, message: 'Program kerja berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
