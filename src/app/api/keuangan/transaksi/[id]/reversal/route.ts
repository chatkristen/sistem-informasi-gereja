import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { reason, actor_name } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, message: 'Alasan pembatalan/reversal wajib diisi' },
        { status: 400 }
      );
    }

    const db = readDatabase();
    const transaction = db.financial_transactions.find((t) => t.id === id);

    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    if (transaction.status === 'REVERSED') {
      return NextResponse.json(
        { success: false, message: 'Transaksi ini sudah pernah dibatalkan (Reversed)' },
        { status: 400 }
      );
    }

    // Rollback account balance
    const sourceAccount = db.financial_accounts.find((a) => a.id === transaction.account_id);
    if (sourceAccount) {
      if (transaction.type === 'INCOME') {
        sourceAccount.current_balance -= transaction.amount;
      } else if (transaction.type === 'EXPENSE') {
        sourceAccount.current_balance += transaction.amount;
      } else if (transaction.type === 'TRANSFER' && transaction.destination_account_id) {
        // Rollback source & destination
        sourceAccount.current_balance += transaction.amount;
        const destAccount = db.financial_accounts.find((a) => a.id === transaction.destination_account_id);
        if (destAccount) {
          destAccount.current_balance -= transaction.amount;
        }
      }
    }

    transaction.status = 'REVERSED';
    transaction.reversal_reason = reason;
    transaction.reversed_at = new Date().toISOString();
    transaction.reversed_by = actor_name || 'Bendahara';

    writeDatabase(db);

    logAudit(db.church.id, actor_name || 'Bendahara', 'REVERSE', 'KEUANGAN', transaction.transaction_number, {
      alasan: reason,
      nominal: transaction.amount,
      tipe: transaction.type,
    });

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil dibatalkan (Reversal dicatat)',
      data: transaction,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
