import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';

export async function GET() {
  try {
    const db = readDatabase();
    const backupData = JSON.stringify(db, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `backup_gkka_db_${dateStr}.json`;

    return new NextResponse(backupData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { database, actor_name } = body;

    if (!database || !database.church || !Array.isArray(database.members)) {
      return NextResponse.json(
        { success: false, message: 'Format data cadangan tidak valid!' },
        { status: 400 }
      );
    }

    writeDatabase(database);

    logAudit(database.church.id, actor_name || 'Admin', 'UPDATE', 'DATABASE_RESTORE', 'Semua Tabel', {
      total_members: database.members.length,
      total_transactions: database.financial_transactions?.length || 0,
      restored_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Database gereja berhasil dipulihkan dari cadangan.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
