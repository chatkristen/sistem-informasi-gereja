import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { FinancialTransaction } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from_account_id, to_account_id, amount, description, actor_name } = body;

    if (!from_account_id || !to_account_id) {
      return NextResponse.json({ success: false, message: 'Akun asal dan akun tujuan harus dipilih' }, { status: 400 });
    }

    if (from_account_id === to_account_id) {
      return NextResponse.json({ success: false, message: 'Akun asal dan tujuan tidak boleh sama' }, { status: 400 });
    }

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Nominal transfer harus lebih dari 0' }, { status: 400 });
    }

    const db = readDatabase();
    const sourceAcc = db.financial_accounts.find((a) => a.id === from_account_id);
    const destAcc = db.financial_accounts.find((a) => a.id === to_account_id);

    if (!sourceAcc || !destAcc) {
      return NextResponse.json({ success: false, message: 'Akun tidak ditemukan' }, { status: 404 });
    }

    if (sourceAcc.current_balance < transferAmount) {
      return NextResponse.json({ success: false, message: 'Saldo akun asal tidak mencukupi untuk transfer ini' }, { status: 400 });
    }

    // Atomic Balance Update
    sourceAcc.current_balance -= transferAmount;
    destAcc.current_balance += transferAmount;

    const currentYear = new Date().getFullYear();
    const count = db.financial_transactions.length + 1;
    const transactionNumber = `TRX-${currentYear}-${String(count).padStart(4, '0')}`;

    const newTransferTrx: FinancialTransaction = {
      id: 'tx-' + Date.now(),
      church_id: db.church.id,
      transaction_number: transactionNumber,
      transaction_date: body.transaction_date || new Date().toISOString().split('T')[0],
      type: 'TRANSFER',
      account_id: sourceAcc.id,
      account_name: sourceAcc.account_name,
      destination_account_id: destAcc.id,
      destination_account_name: destAcc.account_name,
      amount: transferAmount,
      payment_method: 'TRANSFER',
      recording_type: 'COLLECTIVE',
      description: description || `Transfer dari ${sourceAcc.account_name} ke ${destAcc.account_name}`,
      is_confidential: false,
      status: 'RECORDED',
      created_by: 'u1000000-0000-0000-0000-000000000004',
      created_by_name: actor_name || 'Bendahara Gereja',
      created_at: new Date().toISOString(),
    };

    db.financial_transactions.unshift(newTransferTrx);
    writeDatabase(db);

    logAudit(db.church.id, actor_name || 'Bendahara', 'CREATE', 'KEUANGAN', newTransferTrx.transaction_number, {
      aksi: 'TRANSFER_ANTAR_KAS',
      dari: sourceAcc.account_name,
      ke: destAcc.account_name,
      nominal: transferAmount,
    });

    return NextResponse.json({ success: true, data: newTransferTrx });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
