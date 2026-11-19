import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase, logAudit } from '@/lib/db';
import { FinancialTransaction } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // INCOME, EXPENSE, TRANSFER
    const categoryId = searchParams.get('category_id');
    const accountId = searchParams.get('account_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const recordingType = searchParams.get('recording_type'); // COLLECTIVE, INDIVIDUAL
    const role = searchParams.get('role') || 'SUPER_ADMIN';

    const db = readDatabase();
    let transactions = [...db.financial_transactions];

    if (type) {
      transactions = transactions.filter((t) => t.type === type);
    }
    if (categoryId) {
      transactions = transactions.filter((t) => t.category_id === categoryId);
    }
    if (accountId) {
      transactions = transactions.filter(
        (t) => t.account_id === accountId || t.destination_account_id === accountId
      );
    }
    if (startDate) {
      transactions = transactions.filter((t) => t.transaction_date >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter((t) => t.transaction_date <= endDate);
    }
    if (recordingType) {
      transactions = transactions.filter((t) => t.recording_type === recordingType);
    }

    // Role Security Masking for Individual Offerings
    const canSeeIndividual = role === 'SUPER_ADMIN' || role === 'BENDAHARA';
    const sanitized = transactions.map((t) => {
      if (t.is_confidential && !canSeeIndividual) {
        return {
          ...t,
          member_id: undefined,
          member_name: '*** (Dirahasiakan oleh Kebijakan Privasi)',
          member_number: '***',
          description: 'Persembahan Perpuluhan / Pribadi (Data Terkunci)',
        };
      }
      return t;
    });

    return NextResponse.json({
      success: true,
      data: sanitized,
      total: sanitized.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = readDatabase();

    const currentYear = new Date().getFullYear();
    const count = db.financial_transactions.length + 1;
    const transactionNumber = `TRX-${currentYear}-${String(count).padStart(4, '0')}`;

    const account = db.financial_accounts.find((a) => a.id === body.account_id);
    if (!account) {
      return NextResponse.json({ success: false, message: 'Akun kas/bank tidak valid' }, { status: 400 });
    }

    const category = body.category_id
      ? db.financial_categories.find((c) => c.id === body.category_id)
      : undefined;

    const member = body.member_id
      ? db.members.find((m) => m.id === body.member_id)
      : undefined;

    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Nominal transaksi harus lebih dari 0' }, { status: 400 });
    }

    const isConfidential = body.recording_type === 'INDIVIDUAL' || Boolean(body.is_confidential);

    const newTransaction: FinancialTransaction = {
      id: 'tx-' + Date.now(),
      church_id: db.church.id,
      transaction_number: transactionNumber,
      transaction_date: body.transaction_date || new Date().toISOString().split('T')[0],
      type: body.type, // INCOME | EXPENSE | TRANSFER
      category_id: body.category_id || undefined,
      category_name: category?.name,
      account_id: body.account_id,
      account_name: account.account_name,
      amount: amount,
      payment_method: body.payment_method || 'CASH',
      recording_type: body.recording_type || 'COLLECTIVE',
      member_id: body.member_id || undefined,
      member_name: member?.full_name,
      member_number: member?.member_number,
      offering_type: body.offering_type || undefined,
      recipient_name: body.recipient_name || undefined,
      description: body.description || '',
      receipt_url: body.receipt_url || undefined,
      is_confidential: isConfidential,
      status: 'RECORDED',
      created_by: body.created_by || 'u1000000-0000-0000-0000-000000000004',
      created_by_name: body.actor_name || 'Bendahara Gereja',
      created_at: new Date().toISOString(),
    };

    // Update Account Balance Atomically
    if (newTransaction.type === 'INCOME') {
      account.current_balance += amount;
    } else if (newTransaction.type === 'EXPENSE') {
      account.current_balance -= amount;
    }

    db.financial_transactions.unshift(newTransaction);
    writeDatabase(db);

    logAudit(db.church.id, body.actor_name || 'Bendahara', 'CREATE', 'KEUANGAN', newTransaction.transaction_number, {
      tipe: newTransaction.type,
      nominal: newTransaction.amount,
      metode: newTransaction.recording_type,
    });

    return NextResponse.json({ success: true, data: newTransaction });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
