import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { FinancialAccount } from '@/lib/types';

export async function GET() {
  try {
    const db = readDatabase();
    return NextResponse.json({ success: true, data: db.financial_accounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    const newAccount: FinancialAccount = {
      id: 'fa-' + Date.now(),
      church_id: db.church.id,
      account_number: body.account_number,
      account_name: body.account_name,
      account_type: body.account_type || 'BANK',
      initial_balance: Number(body.initial_balance) || 0,
      current_balance: Number(body.initial_balance) || 0,
      status: 'ACTIVE',
    };

    db.financial_accounts.push(newAccount);
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Bendahara', 'CREATE', 'KEUANGAN', newAccount.account_number, {
      nama_akun: newAccount.account_name,
      saldo_awal: newAccount.initial_balance,
    });

    return NextResponse.json({ success: true, data: newAccount });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = readDatabase();
    const index = db.financial_accounts.findIndex((a) => a.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Akun kas/bank tidak ditemukan' }, { status: 404 });
    }

    const removed = db.financial_accounts[index];
    if (removed.current_balance !== 0) {
      return NextResponse.json({
        success: false,
        message: 'Akun kas yang masih memiliki saldo tidak dapat dihapus. Silakan transfer saldo terlebih dahulu.',
      }, { status: 400 });
    }

    db.financial_accounts.splice(index, 1);
    writeDatabase(db);

    logAudit(db.church.id, 'Bendahara', 'DELETE', 'KEUANGAN', removed.account_number, {
      nama_akun: removed.account_name,
    });

    return NextResponse.json({ success: true, message: 'Akun kas berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
