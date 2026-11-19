import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module');
    const action = searchParams.get('action');

    const db = readDatabase();
    let logs = [...db.audit_logs];

    if (module) {
      logs = logs.filter((l) => l.module === module);
    }
    if (action) {
      logs = logs.filter((l) => l.action === action);
    }

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
