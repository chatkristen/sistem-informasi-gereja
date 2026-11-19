import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { DiakoniaRequest } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role') || 'SUPER_ADMIN';

    const db = readDatabase();
    let requests = [...db.diakonia_requests];

    if (status) {
      requests = requests.filter((r) => r.status === status);
    }

    // Role Confidentiality check
    const canSeeDetails = role === 'SUPER_ADMIN' || role === 'PENDETA' || role === 'BENDAHARA';
    const sanitized = requests.map((r) => {
      if (r.is_confidential && !canSeeDetails) {
        return {
          ...r,
          recipient_name: '*** (Dirahasiakan oleh Kebijakan Kasih Diakonia)',
          description: '[Kebutuhan Bantuan Sosial Dilindungi]',
          verification_notes: undefined,
        };
      }
      return r;
    });

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    const currentYear = new Date().getFullYear();
    const count = db.diakonia_requests.length + 1;
    const requestNumber = `DIA-${currentYear}-${String(count).padStart(4, '0')}`;

    const newRequest: DiakoniaRequest = {
      id: 'dia-' + Date.now(),
      church_id: db.church.id,
      request_number: requestNumber,
      member_id: body.member_id || undefined,
      recipient_name: body.recipient_name,
      request_date: body.request_date || new Date().toISOString().split('T')[0],
      category: body.category || 'BANTUAN_KESEHATAN',
      description: body.description,
      urgency_level: body.urgency_level || 'MEDIUM',
      requested_amount: Number(body.requested_amount) || 0,
      status: 'SUBMITTED',
      verification_notes: body.verification_notes || '',
      is_confidential: true,
      created_by: body.created_by || 'u3',
      created_at: new Date().toISOString(),
    };

    db.diakonia_requests.push(newRequest);
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Tim Diakonia', 'CREATE', 'DIAKONIA', newRequest.request_number, {
      kategori: newRequest.category,
      urgensi: newRequest.urgency_level,
      nominal: newRequest.requested_amount,
    });

    return NextResponse.json({ success: true, data: newRequest });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, verification_notes, approved_by, approved_by_name, actor_name } = body;

    const db = readDatabase();
    const diakonia = db.diakonia_requests.find((d) => d.id === id);

    if (!diakonia) {
      return NextResponse.json({ success: false, message: 'Permohonan bantuan tidak ditemukan' }, { status: 404 });
    }

    if (status) diakonia.status = status;
    if (verification_notes !== undefined) diakonia.verification_notes = verification_notes;
    if (approved_by) diakonia.approved_by = approved_by;
    if (approved_by_name) diakonia.approved_by_name = approved_by_name;

    writeDatabase(db);
    logAudit(db.church.id, actor_name || 'Pengurus Diakonia', 'UPDATE', 'DIAKONIA', diakonia.request_number, {
      status_baru: diakonia.status,
      disetujui_oleh: diakonia.approved_by_name,
    });

    return NextResponse.json({ success: true, data: diakonia });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
